import { PoolClient } from 'pg';
import { runWithDatabase } from '../config/database';
import { Outlet } from '../entities/outlet';
import { outletQueries } from './queries/outletQueries';

const ensureClient = (client: PoolClient | null) => {
  if (!client) {
    throw new Error('Database client is not available');
  }

  return client;
};

class OutletRepository {
  async create(name: string, address: string, phoneNumber: string | null) {
    return runWithDatabase(async (client) => {
      const db = ensureClient(client);
      const result = await db.query(outletQueries.insert, [name, address, phoneNumber]);
      return this.mapRow(result.rows[0]);
    });
  }

  async list(limit = 10, offset = 0) {
    return runWithDatabase(async (client) => {
      const db = ensureClient(client);
      const result = await db.query(outletQueries.list, [limit, offset]);
      return result.rows.map((row) => this.mapRow(row));
    });
  }

  async findById(id: string) {
    return runWithDatabase(async (client) => {
      const db = ensureClient(client);
      const result = await db.query(outletQueries.findById, [id]);
      return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    });
  }

  private mapRow(row: any): Outlet {
    return {
      id: String(row.id),
      name: row.name,
      address: row.address,
      phoneNumber: row.phone_number ?? null,
      createdAt: row.created_at?.toISOString?.() ?? row.created_at
    };
  }
}

export const outletRepository = new OutletRepository();
