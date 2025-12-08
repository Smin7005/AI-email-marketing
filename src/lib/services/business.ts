import { db } from '../db';
import { businesses } from '../db/schema';
import { and, eq, ilike, or, desc, asc, sql } from 'drizzle-orm';

export interface BusinessSearchParams {
  cities?: string[];
  industries?: string[];
  city?: string; // Backward compatibility
  industry?: string; // Backward compatibility
  search?: string;
  page?: number;
  limit?: number;
}

export interface BusinessSearchResult {
  businesses: typeof businesses.$inferSelect[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class BusinessService {
  /**
   * Search businesses with filters
   * @param params Search parameters
   * @returns Search results with pagination
   */
  async searchBusinesses(params: BusinessSearchParams): Promise<BusinessSearchResult> {
    const {
      cities,
      industries,
      city,
      industry,
      search,
      page = 1,
      limit = 50
    } = params;

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    // Handle array of cities (new format)
    if (cities && cities.length > 0) {
      const cityConditions = cities.map(c => ilike(businesses.city, `%${c}%`));
      conditions.push(or(...cityConditions));
    } else if (city) {
      // Handle single city (backward compatibility)
      conditions.push(ilike(businesses.city, `%${city}%`));
    }

    // Handle array of industries (new format)
    if (industries && industries.length > 0) {
      const industryConditions = industries.map(i => ilike(businesses.industry, `%${i}%`));
      conditions.push(or(...industryConditions));
    } else if (industry) {
      // Handle single industry (backward compatibility)
      conditions.push(ilike(businesses.industry, `%${industry}%`));
    }

    if (search) {
      conditions.push(
        or(
          ilike(businesses.name, `%${search}%`),
          ilike(businesses.description, `%${search}%`),
          ilike(businesses.email, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(businesses)
      .where(whereClause);

    const total = totalResult[0].count;

    // Get paginated results
    const results = await db
      .select()
      .from(businesses)
      .where(whereClause)
      .orderBy(asc(businesses.name))
      .limit(limit)
      .offset(offset);

    return {
      businesses: results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get business by ID
   * @param id Business ID
   * @returns Business or null
   */
  async getBusinessById(id: number) {
    const result = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get all unique cities
   * @returns Array of city names
   */
  async getCities(): Promise<string[]> {
    const results = await db
      .select({
        city: businesses.city
      })
      .from(businesses)
      .groupBy(businesses.city)
      .orderBy(asc(businesses.city));

    return results.map(r => r.city);
  }

  /**
   * Get all unique industries
   * @returns Array of industry names
   */
  async getIndustries(): Promise<string[]> {
    const results = await db
      .select({
        industry: businesses.industry
      })
      .from(businesses)
      .groupBy(businesses.industry)
      .orderBy(asc(businesses.industry));

    return results.map(r => r.industry);
  }

  /**
   * Get businesses by IDs
   * @param ids Array of business IDs
   * @returns Array of businesses
   */
  async getBusinessesByIds(ids: number[]) {
    const results = await db
      .select()
      .from(businesses)
      .where(sql`${businesses.id} in ${sql.join(ids.map(id => sql`${id}`))}`)
      .orderBy(asc(businesses.name));

    return results;
  }

  /**
   * Check if businesses exist by IDs
   * @param ids Array of business IDs
   * @returns Object with found and not found IDs
   */
  async validateBusinessIds(ids: number[]) {
    const results = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(sql`${businesses.id} in ${sql.join(ids.map(id => sql`${id}`))}`);

    const foundIds = results.map(r => r.id);
    const notFoundIds = ids.filter(id => !foundIds.includes(id));

    return {
      found: foundIds,
      notFound: notFoundIds
    };
  }
}

export const businessService = new BusinessService();