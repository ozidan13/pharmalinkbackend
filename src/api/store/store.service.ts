import { PrismaClient } from '@prisma/client';
import { prisma } from '../../server';

// Define the type for product with pharmacy owner info
type ProductWithPharmacy = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  isNearExpiry: boolean;
  expiryDate: Date | null;
  imageUrl: string | null;
  stock: number;
  pharmacyOwnerId: string;
  pharmacyOwner: {
    id: string;
    pharmacyName: string;
    contactPerson: string;
    phoneNumber: string | null;
    address: string | null;
    city: string;
    area: string | null;
  };
};

interface SearchProductsParams {
  query?: string;
  category?: string | string[];
  nearExpiry?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  pharmacyId?: string;
  city?: string;
  area?: string;
  sortBy?: 'price' | 'expiryDate' | 'createdAt' | 'distance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchProductsResult {
  products: ProductWithPharmacy[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters?: {
    categories: string[];
    priceRange: {
      min: number;
      max: number;
    };
  };
}

/**
 * Search for products with advanced filtering and geospatial search
 */
export const searchProductsService = async ({
  query,
  category,
  nearExpiry,
  minPrice,
  maxPrice,
  inStock,
  pharmacyId,
  city,
  area,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  page = 1,
  limit = 10,
}: SearchProductsParams): Promise<SearchProductsResult> => {
  try {
    // Input validation
    page = Math.max(1, page);
    limit = Math.min(100, Math.max(1, limit));

    // Build base filter
    const baseFilter: any = {
      AND: [
        // Text search on name and description
        query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {},
        // Category filter (supports single or multiple categories)
        category
          ? Array.isArray(category)
            ? { category: { in: category } }
            : { category }
          : {},
        // Near expiry filter
        nearExpiry ? { isNearExpiry: true } : {},
        // Price range filter
        {
          AND: [
            minPrice !== undefined ? { price: { gte: minPrice } } : {},
            maxPrice !== undefined ? { price: { lte: maxPrice } } : {},
          ],
        },
        // Stock filter
        inStock ? { stock: { gt: 0 } } : {},
        // Pharmacy filter
        pharmacyId ? { pharmacyOwnerId: pharmacyId } : {},
      ],
    };

    // Add location filters if city/area provided
    if (city) {
      const locationFilter: any = {
        pharmacyOwner: {
          city: {
            equals: city,
            mode: 'insensitive',
          },
        },
      };
      
      // Add area filter if provided
      if (area) {
        locationFilter.pharmacyOwner.area = {
          equals: area,
          mode: 'insensitive',
        };
      }
      
      baseFilter.AND!.push(locationFilter);
    }

    // Get total count and products in parallel
    const [totalCount, products] = await Promise.all([
      prisma.product.count({
        where: {
          ...baseFilter,
        },
      }),

      prisma.product.findMany({
        where: {
          ...baseFilter,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          pharmacyOwner: {
            select: {
              id: true,
              pharmacyName: true,
              contactPerson: true,
              phoneNumber: true,
              address: true,
              city: true,
              area: true,
            },
          },
        },
      }),
    ]);

    // Get price range and categories in parallel
    const [minPriceResult, maxPriceResult, categories] = await Promise.all([
      prisma.$queryRaw<Array<{ minprice: number }>>`SELECT MIN(price) as minPrice FROM "Product"`,
      prisma.$queryRaw<Array<{ maxprice: number }>>`SELECT MAX(price) as maxPrice FROM "Product"`,
      prisma.product.findMany({
        select: {
          category: true,
        },
        distinct: ['category'],
      })
    ]);

    const priceRange = {
      min: minPriceResult[0]?.minprice || 0,
      max: maxPriceResult[0]?.maxprice || 0,
    };

    const allCategories = Array.from(
      new Set(categories.map((r: { category: string | null }) => r.category).filter((c: string | null): c is string => !!c))
    );

    // Sort by city/area if needed
    if (sortBy === 'distance') {
      (products as ProductWithPharmacy[]).sort((a, b) => {
        // First sort by city
        const cityA = a.pharmacyOwner.city?.toLowerCase() || '';
        const cityB = b.pharmacyOwner.city?.toLowerCase() || '';
        
        if (cityA !== cityB) {
          return sortOrder === 'asc' 
            ? cityA.localeCompare(cityB)
            : cityB.localeCompare(cityA);
        }
        
        // If same city, sort by area if available
        const areaA = a.pharmacyOwner.area?.toLowerCase() || '';
        const areaB = b.pharmacyOwner.area?.toLowerCase() || '';
        
        return sortOrder === 'asc'
          ? areaA.localeCompare(areaB)
          : areaB.localeCompare(areaA);
      });
    }

    return {
      products: products as unknown as ProductWithPharmacy[],
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
      filters: {
        categories: allCategories as string[],
        priceRange: {
          min: priceRange.min,
          max: priceRange.max,
        },
      },
    };
  } catch (error) {
    console.error('Error in searchProductsService:', error);
    throw new Error('Failed to search products');
  }
};