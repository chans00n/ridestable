// Request deduplicator to prevent duplicate API calls
interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly CACHE_DURATION = 5000; // 5 seconds

  // Generate a unique key for the request
  private generateKey(method: string, url: string, data?: any): string {
    const dataStr = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataStr}`;
  }

  // Clean up old cached requests
  private cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.CACHE_DURATION) {
        this.pendingRequests.delete(key);
      }
    }
  }

  // Deduplicate requests
  async deduplicate<T>(
    method: string,
    url: string,
    data: any,
    requestFn: () => Promise<T>
  ): Promise<T> {
    this.cleanup();
    
    const key = this.generateKey(method, url, data);
    const existing = this.pendingRequests.get(key);
    
    if (existing) {
      console.log(`[RequestDeduplicator] Returning cached request for ${key}`);
      return existing.promise;
    }
    
    const promise = requestFn()
      .then((result) => {
        // Keep successful results in cache briefly
        setTimeout(() => {
          this.pendingRequests.delete(key);
        }, 1000);
        return result;
      })
      .catch((error) => {
        // Remove failed requests immediately
        this.pendingRequests.delete(key);
        throw error;
      });
    
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });
    
    return promise;
  }

  // Clear all pending requests
  clear(): void {
    this.pendingRequests.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();