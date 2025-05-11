/**
 * 简单的内存缓存服务
 * 用于缓存频繁访问但不常变化的数据
 */

// 缓存项类型
interface CacheItem<T> {
  value: T;
  expiry: number;
}

// 缓存配置类型
interface CacheConfig {
  defaultTTL: number; // 默认缓存有效期（毫秒）
  maxSize: number;    // 最大缓存项数量
  cleanupInterval: number; // 清理间隔（毫秒）
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheItem<any>>;
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor(config?: Partial<CacheConfig>) {
    this.cache = new Map();
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 默认5分钟
      maxSize: 1000,             // 默认最多1000项
      cleanupInterval: 60 * 1000, // 默认1分钟清理一次
      ...config
    };

    // 启动定时清理
    this.startCleanup();
  }

  /**
   * 获取缓存服务实例
   */
  public static getInstance(config?: Partial<CacheConfig>): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  /**
   * 设置缓存项
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 有效期（毫秒），默认使用配置的默认值
   */
  public set<T>(key: string, value: T, ttl?: number): void {
    // 如果缓存已满，先清理过期项
    if (this.cache.size >= this.config.maxSize) {
      this.cleanup();
      
      // 如果仍然满，删除最早的项
      if (this.cache.size >= this.config.maxSize) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }
    }

    const expiryTime = Date.now() + (ttl || this.config.defaultTTL);
    this.cache.set(key, { value, expiry: expiryTime });
  }

  /**
   * 获取缓存项
   * @param key 缓存键
   * @returns 缓存值，不存在或已过期返回null
   */
  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    // 缓存不存在
    if (!item) {
      return null;
    }
    
    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  /**
   * 删除缓存项
   * @param key 缓存键
   */
  public delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * 获取或设置缓存
   * 如果缓存存在且未过期，返回缓存值
   * 否则执行回调函数获取新值并缓存
   * @param key 缓存键
   * @param callback 获取新值的回调函数
   * @param ttl 有效期（毫秒）
   */
  public async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cachedValue = this.get<T>(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    // 缓存不存在或已过期，执行回调获取新值
    const newValue = await callback();
    this.set(key, newValue, ttl);
    return newValue;
  }

  /**
   * 清理过期的缓存项
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 启动定时清理
   */
  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(
      () => this.cleanup(),
      this.config.cleanupInterval
    );
  }

  /**
   * 停止定时清理
   */
  public stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// 导出默认缓存实例
export const cacheService = CacheService.getInstance(); 