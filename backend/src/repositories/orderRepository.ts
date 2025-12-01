import { runWithDatabase } from '../config/database';
import { OrderPreview } from '../entities/orderPreview';

class OrderRepository {
  private previews: OrderPreview[] = [];

  async save(preview: OrderPreview) {
    return runWithDatabase(async (_client) => {
      this.previews.push(preview);
      return preview;
    });
  }

  async list(limit = 10) {
    return runWithDatabase(async (_client) => this.previews.slice(-limit).reverse());
  }
}

export const orderRepository = new OrderRepository();
