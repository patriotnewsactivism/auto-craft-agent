/**
 * Expert-level code templates and patterns
 * Pre-loaded knowledge for immediate expert performance
 */

export interface ExpertTemplate {
  name: string;
  category: string;
  description: string;
  useCase: string[];
  template: string;
  dependencies?: string[];
  bestPractices: string[];
}

export const EXPERT_TEMPLATES: ExpertTemplate[] = [
  // ==================== REACT COMPONENTS ====================
  {
    name: 'Advanced Data Table with Sorting & Filtering',
    category: 'react-component',
    description: 'Production-ready data table with sorting, filtering, pagination',
    useCase: ['admin panels', 'dashboards', 'data management'],
    template: `import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  pageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  pageSize = 10
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filteredData = useMemo(() => {
    let result = [...data];
    
    if (search) {
      result = result.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(search.toLowerCase())
        )
      );
    }
    
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        const order = sortOrder === 'asc' ? 1 : -1;
        return aVal > bVal ? order : -order;
      });
    }
    
    return result;
  }, [data, search, sortKey, sortOrder]);

  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      {searchable && (
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)}>
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column.key)}
                      className="h-8 px-2"
                    >
                      {column.label}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>
                    {column.render
                      ? column.render(item[column.key], item)
                      : String(item[column.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}`,
    dependencies: ['@/components/ui/table', '@/components/ui/input', '@/components/ui/button', 'lucide-react'],
    bestPractices: ['Memoization for performance', 'Generic type support', 'Controlled components', 'Accessible UI']
  },

  {
    name: 'Form with Validation & Error Handling',
    category: 'react-component',
    description: 'Complete form with React Hook Form and Zod validation',
    useCase: ['user input', 'data submission', 'authentication forms'],
    template: `import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

interface FormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

export function ValidatedForm({ onSubmit, isLoading = false }: FormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const handleSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
      toast.success('Form submitted successfully!');
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Submission failed');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" type="email" {...field} />
              </FormControl>
              <FormDescription>We'll never share your email.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="••••••••" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input placeholder="••••••••" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Form>
  );
}`,
    dependencies: ['react-hook-form', 'zod', '@hookform/resolvers/zod', 'sonner'],
    bestPractices: ['Type-safe validation', 'Error handling', 'Loading states', 'Toast notifications']
  },

  // ==================== CUSTOM HOOKS ====================
  {
    name: 'useAsync - Data Fetching Hook',
    category: 'react-hook',
    description: 'Reusable hook for async operations with loading and error states',
    useCase: ['API calls', 'data fetching', 'async operations'],
    template: `import { useState, useEffect, useCallback } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: () => Promise<void>;
  reset: () => void;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      });
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute, reset };
}

// Usage example:
// const { data, loading, error, execute } = useAsync(() => fetchUserData(userId));`,
    dependencies: ['react'],
    bestPractices: ['Error handling', 'Loading states', 'Cleanup', 'Memoization']
  },

  {
    name: 'useLocalStorage - Persistent State',
    category: 'react-hook',
    description: 'Hook for syncing state with localStorage',
    useCase: ['user preferences', 'persistent state', 'caching'],
    template: `import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Get from local storage then parse stored json or return initialValue
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(\`Error reading localStorage key "\${key}":\`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(\`Error setting localStorage key "\${key}":\`, error);
      }
    },
    [key, storedValue]
  );

  const remove = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(\`Error removing localStorage key "\${key}":\`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to this key from other windows/tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, remove];
}`,
    dependencies: ['react'],
    bestPractices: ['SSR compatibility', 'Error handling', 'Cross-tab sync', 'Type safety']
  },

  // ==================== API & BACKEND ====================
  {
    name: 'Type-Safe API Client',
    category: 'api',
    description: 'Robust API client with TypeScript and error handling',
    useCase: ['REST API calls', 'data fetching', 'HTTP requests'],
    template: `type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiConfig {
  baseURL: string;
  headers?: Record<string, string>;
  timeout?: number;
}

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private config: Required<ApiConfig>;

  constructor(config: ApiConfig) {
    this.config = {
      baseURL: config.baseURL,
      headers: config.headers || {},
      timeout: config.timeout || 30000
    };
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = new URL(endpoint, this.config.baseURL);
    
    // Add query parameters
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...options.headers
    };

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeout || this.config.timeout
    );

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || response.statusText,
          response.status,
          errorData
        );
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  setHeader(key: string, value: string): void {
    this.config.headers[key] = value;
  }

  removeHeader(key: string): void {
    delete this.config.headers[key];
  }
}

// Usage:
// const api = new ApiClient({ baseURL: 'https://api.example.com' });
// const data = await api.get<User>('/users/1');`,
    dependencies: [],
    bestPractices: ['Type safety', 'Error handling', 'Timeout support', 'Abort support', 'Flexible configuration']
  },

  // ==================== STATE MANAGEMENT ====================
  {
    name: 'Zustand Store Pattern',
    category: 'state-management',
    description: 'Modern state management with Zustand',
    useCase: ['global state', 'app-wide data', 'state management'],
    template: `import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,

        login: (user, token) =>
          set({ user, token, isAuthenticated: true }, false, 'auth/login'),

        logout: () =>
          set(
            { user: null, token: null, isAuthenticated: false },
            false,
            'auth/logout'
          ),

        updateUser: (updates) =>
          set(
            (state) => ({
              user: state.user ? { ...state.user, ...updates } : null
            }),
            false,
            'auth/updateUser'
          )
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated
        })
      }
    )
  )
);

// Usage in components:
// const { user, isAuthenticated, login, logout } = useAuthStore();`,
    dependencies: ['zustand'],
    bestPractices: ['Type safety', 'Persistence', 'DevTools integration', 'Selective rehydration']
  },

  // ==================== UTILITIES ====================
  {
    name: 'Debounce & Throttle Utilities',
    category: 'utility',
    description: 'Performance optimization utilities',
    useCase: ['search inputs', 'scroll handlers', 'resize handlers'],
    template: `export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// React hook versions
import { useCallback, useRef, useEffect } from 'react';

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const throttlingRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (throttlingRef.current) return;

      callbackRef.current(...args);
      throttlingRef.current = true;

      setTimeout(() => {
        throttlingRef.current = false;
      }, delay);
    },
    [delay]
  );
}`,
    dependencies: ['react'],
    bestPractices: ['Type safety', 'Memory cleanup', 'Ref stability', 'Performance optimization']
  },

  // ==================== AUTHENTICATION ====================
  {
    name: 'Protected Route Component',
    category: 'authentication',
    description: 'Route guard for authenticated pages',
    useCase: ['protected pages', 'authentication', 'authorization'],
    template: `import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Usage in routes:
// <Route path="/dashboard" element={
//   <ProtectedRoute>
//     <Dashboard />
//   </ProtectedRoute>
// } />`,
    dependencies: ['react-router-dom'],
    bestPractices: ['State preservation', 'Role-based access', 'Redirect handling']
  }
];

export const ARCHITECTURE_PATTERNS = {
  'spa': {
    name: 'Single Page Application',
    description: 'Client-side rendered app with routing',
    structure: {
      'src/pages': 'Page components',
      'src/components': 'Reusable UI components',
      'src/hooks': 'Custom React hooks',
      'src/lib': 'Utilities and services',
      'src/stores': 'State management',
      'src/types': 'TypeScript types'
    }
  },
  'dashboard': {
    name: 'Admin Dashboard',
    description: 'Data-heavy admin interface',
    structure: {
      'src/layouts': 'Layout components (sidebar, header)',
      'src/features': 'Feature-based modules',
      'src/components/charts': 'Chart components',
      'src/components/tables': 'Table components',
      'src/api': 'API clients',
      'src/stores': 'State management'
    }
  },
  'ecommerce': {
    name: 'E-commerce Platform',
    description: 'Online store with cart and checkout',
    structure: {
      'src/features/products': 'Product listing and details',
      'src/features/cart': 'Shopping cart',
      'src/features/checkout': 'Checkout flow',
      'src/features/auth': 'Authentication',
      'src/components/ui': 'UI components',
      'src/lib/payments': 'Payment integration'
    }
  }
};

export function getTemplatesByCategory(category: string): ExpertTemplate[] {
  return EXPERT_TEMPLATES.filter(t => t.category === category);
}

export function findRelevantTemplates(keywords: string[]): ExpertTemplate[] {
  return EXPERT_TEMPLATES.filter(template =>
    keywords.some(keyword =>
      template.name.toLowerCase().includes(keyword.toLowerCase()) ||
      template.useCase.some(uc => uc.toLowerCase().includes(keyword.toLowerCase()))
    )
  );
}
