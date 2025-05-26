export interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
  priority: number; // Higher number = higher priority
  addedAt: Date;
}

export class PriorityQueue {
  private items: QueueItem[] = [];

  enqueue(item: Omit<QueueItem, 'addedAt' | 'id'>) {
    const newItem: QueueItem = {
      ...item,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      addedAt: new Date()
    };
    
    // Find the index to insert the new item based on priority
    let added = false;
    for (let i = 0; i < this.items.length; i++) {
      if (newItem.priority > this.items[i].priority) {
        this.items.splice(i, 0, newItem);
        added = true;
        break;
      }
    }
    
    // If not added (lowest priority or empty queue), push to end
    if (!added) {
      this.items.push(newItem);
    }
    
    return newItem.id;
  }

  dequeue(): QueueItem | undefined {
    return this.items.shift();
  }

  remove(id: string): boolean {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== id);
    return this.items.length !== initialLength;
  }

  moveToTop(id: string): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    const [item] = this.items.splice(index, 1);
    item.priority = this.getMaxPriority() + 1;
    this.items.unshift(item);
    return true;
  }

  clear(): void {
    this.items = [];
  }

  getQueue(): QueueItem[] {
    return [...this.items];
  }

  getNextItem(): QueueItem | undefined {
    return this.items[0];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  private getMaxPriority(): number {
    if (this.isEmpty()) return 0;
    return Math.max(...this.items.map(item => item.priority));
  }
}
