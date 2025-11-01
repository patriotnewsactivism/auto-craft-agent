/**
 * Reseller Program Service
 * Flat 40% commission for all resellers
 */

export interface ResellerProfile {
  id: string;
  userId: string;
  resellerCode: string;
  email: string;
  name: string;
  commissionRate: number; // Always 40% (0.40)
  totalEarnings: number;
  pendingEarnings: number;
  totalReferrals: number;
  activeReferrals: number;
  paymentMethod?: 'paypal' | 'stripe' | 'bank_transfer';
  paymentDetails?: string;
  createdAt: string;
  status: 'active' | 'pending' | 'suspended';
}

export interface ResellerSale {
  id: string;
  resellerId: string;
  customerId: string;
  customerEmail: string;
  amount: number;
  commission: number; // 40% of amount
  subscriptionPlan: string;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
}

export interface ResellerStats {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayouts: number;
  totalReferrals: number;
  activeSubscriptions: number;
  conversionRate: number;
  averageSaleValue: number;
}

const COMMISSION_RATE = 0.40; // Flat 40% for everyone

class ResellerService {
  /**
   * Generate unique reseller code
   */
  generateResellerCode(name: string): string {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${cleanName.substring(0, 6)}-${random}`;
  }

  /**
   * Register as a reseller
   */
  async registerReseller(data: {
    userId: string;
    email: string;
    name: string;
  }): Promise<ResellerProfile> {
    const resellerCode = this.generateResellerCode(data.name);

    const profile: ResellerProfile = {
      id: crypto.randomUUID(),
      userId: data.userId,
      resellerCode,
      email: data.email,
      name: data.name,
      commissionRate: COMMISSION_RATE,
      totalEarnings: 0,
      pendingEarnings: 0,
      totalReferrals: 0,
      activeReferrals: 0,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    // Save to database (Supabase)
    await this.saveToDatabase('reseller_profiles', profile);

    return profile;
  }

  /**
   * Get reseller profile
   */
  async getResellerProfile(userId: string): Promise<ResellerProfile | null> {
    // Fetch from database
    const profile = await this.fetchFromDatabase('reseller_profiles', { userId });
    return profile;
  }

  /**
   * Track a sale/referral
   */
  async trackSale(data: {
    resellerCode: string;
    customerEmail: string;
    amount: number;
    subscriptionPlan: string;
  }): Promise<ResellerSale> {
    // Find reseller by code
    const reseller = await this.fetchFromDatabase('reseller_profiles', { 
      resellerCode: data.resellerCode 
    });

    if (!reseller) {
      throw new Error('Invalid reseller code');
    }

    // Calculate 40% commission
    const commission = data.amount * COMMISSION_RATE;

    const sale: ResellerSale = {
      id: crypto.randomUUID(),
      resellerId: reseller.id,
      customerId: crypto.randomUUID(),
      customerEmail: data.customerEmail,
      amount: data.amount,
      commission,
      subscriptionPlan: data.subscriptionPlan,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Save sale
    await this.saveToDatabase('reseller_sales', sale);

    // Update reseller stats
    await this.updateResellerStats(reseller.id, commission);

    return sale;
  }

  /**
   * Get reseller statistics
   */
  async getResellerStats(resellerId: string): Promise<ResellerStats> {
    const sales = await this.fetchFromDatabase('reseller_sales', { resellerId });

    const totalEarnings = sales
      .filter((s: ResellerSale) => s.status === 'paid')
      .reduce((sum: number, s: ResellerSale) => sum + s.commission, 0);

    const pendingPayouts = sales
      .filter((s: ResellerSale) => s.status === 'confirmed')
      .reduce((sum: number, s: ResellerSale) => sum + s.commission, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthlyEarnings = sales
      .filter((s: ResellerSale) => 
        s.status === 'paid' && new Date(s.createdAt) >= thisMonth
      )
      .reduce((sum: number, s: ResellerSale) => sum + s.commission, 0);

    const totalReferrals = sales.length;
    const activeSubscriptions = sales.filter(
      (s: ResellerSale) => s.status === 'confirmed' || s.status === 'paid'
    ).length;

    const averageSaleValue = totalReferrals > 0
      ? sales.reduce((sum: number, s: ResellerSale) => sum + s.amount, 0) / totalReferrals
      : 0;

    return {
      totalEarnings,
      monthlyEarnings,
      pendingPayouts,
      totalReferrals,
      activeSubscriptions,
      conversionRate: 0, // Would need traffic data
      averageSaleValue
    };
  }

  /**
   * Get all sales for a reseller
   */
  async getResellerSales(resellerId: string): Promise<ResellerSale[]> {
    return await this.fetchFromDatabase('reseller_sales', { resellerId });
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(
    resellerId: string,
    paymentMethod: ResellerProfile['paymentMethod'],
    paymentDetails: string
  ): Promise<void> {
    await this.updateDatabase('reseller_profiles', resellerId, {
      paymentMethod,
      paymentDetails
    });
  }

  /**
   * Request payout
   */
  async requestPayout(resellerId: string, amount: number): Promise<void> {
    const profile = await this.getResellerProfile(resellerId);
    
    if (!profile) {
      throw new Error('Reseller not found');
    }

    if (profile.pendingEarnings < amount) {
      throw new Error('Insufficient funds');
    }

    // Create payout request
    await this.saveToDatabase('payout_requests', {
      id: crypto.randomUUID(),
      resellerId,
      amount,
      commission: amount, // Already calculated
      status: 'pending',
      requestedAt: new Date().toISOString()
    });

    // Update pending earnings
    await this.updateDatabase('reseller_profiles', resellerId, {
      pendingEarnings: profile.pendingEarnings - amount
    });
  }

  /**
   * Get reseller's referral link
   */
  getResellerLink(resellerCode: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${resellerCode}`;
  }

  /**
   * Validate referral code
   */
  async validateResellerCode(code: string): Promise<boolean> {
    const reseller = await this.fetchFromDatabase('reseller_profiles', { 
      resellerCode: code 
    });
    return reseller && reseller.status === 'active';
  }

  /**
   * Update reseller stats
   */
  private async updateResellerStats(resellerId: string, commission: number): Promise<void> {
    const profile = await this.fetchFromDatabase('reseller_profiles', { id: resellerId });
    
    if (profile) {
      await this.updateDatabase('reseller_profiles', resellerId, {
        totalReferrals: (profile.totalReferrals || 0) + 1,
        pendingEarnings: (profile.pendingEarnings || 0) + commission
      });
    }
  }

  /**
   * Database helpers (integrate with Supabase)
   */
  private async saveToDatabase(table: string, data: any): Promise<void> {
    // Check if Supabase is configured
    // Import apiKeyStorage dynamically to avoid circular dependencies
    const { apiKeyStorage } = await import('./safeStorage');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || apiKeyStorage.getAPIKey('supabase_url');
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || apiKeyStorage.getAPIKey('supabase_key');

    if (!supabaseUrl || !supabaseKey) {
      // Fallback to localStorage for demo
      const key = `${table}_${data.id}`;
      localStorage.setItem(key, JSON.stringify(data));
      
      // Also store in index
      const indexKey = `${table}_index`;
      let index: string[] = [];
      try {
        const stored = localStorage.getItem(indexKey);
        index = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error('Failed to parse index:', e);
        index = [];
      }
      index.push(data.id);
      localStorage.setItem(indexKey, JSON.stringify(index));
      return;
    }

    // Use Supabase
    const { supabaseService } = await import('./supabaseService');
    // Implementation would use Supabase client here
  }

  private async fetchFromDatabase(table: string, filters: any): Promise<any> {
    // Import apiKeyStorage dynamically to avoid circular dependencies
    const { apiKeyStorage } = await import('./safeStorage');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || apiKeyStorage.getAPIKey('supabase_url');
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || apiKeyStorage.getAPIKey('supabase_key');

    if (!supabaseUrl || !supabaseKey) {
      // Fallback to localStorage
      const indexKey = `${table}_index`;
      let index: string[] = [];
      try {
        const stored = localStorage.getItem(indexKey);
        index = stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error('Failed to parse index:', e);
        index = [];
      }
      
      const results = [];
      for (const id of index) {
        const key = `${table}_${id}`;
        const item = localStorage.getItem(key);
        if (item) {
          let parsed;
          try {
            parsed = JSON.parse(item);
          } catch (e) {
            console.error('Failed to parse item:', e);
            continue;
          }
          // Check if matches filters
          let matches = true;
          for (const [key, value] of Object.entries(filters)) {
            if (parsed[key] !== value) {
              matches = false;
              break;
            }
          }
          if (matches) {
            results.push(parsed);
          }
        }
      }
      
      return results.length === 1 ? results[0] : results;
    }

    // Use Supabase
    return null;
  }

  private async updateDatabase(table: string, id: string, updates: any): Promise<void> {
    // Import apiKeyStorage dynamically to avoid circular dependencies
    const { apiKeyStorage } = await import('./safeStorage');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || apiKeyStorage.getAPIKey('supabase_url');
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || apiKeyStorage.getAPIKey('supabase_key');

    if (!supabaseUrl || !supabaseKey) {
      // Fallback to localStorage
      const key = `${table}_${id}`;
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        const updated = { ...parsed, ...updates };
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return;
    }

    // Use Supabase
  }
}

export const resellerService = new ResellerService();
