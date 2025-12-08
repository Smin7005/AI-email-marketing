import { db } from './index';
import { SQL, sql } from 'drizzle-orm';

export abstract class BaseRepository<T> {
  protected abstract table: any;

  async findById(id: number): Promise<T | null> {
    const result = await db.select().from(this.table).where(sql`${this.table.id} = ${id}`).limit(1);
    return result[0] as T || null;
  }

  async findAll(): Promise<T[]> {
    return await db.select().from(this.table) as T[];
  }

  async count(where?: SQL): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(where || sql`1=1`);
    return result[0].count;
  }

  async deleteById(id: number): Promise<void> {
    await db.delete(this.table).where(sql`${this.table.id} = ${id}`);
  }
}