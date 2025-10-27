export const sampleCode = {
  dashboard: `import { useData } from '@/hooks/useData';
import { UserPanel } from './UserPanel';
import { Card } from '@/components/ui/card';

export const Dashboard = () => {
  const { data, loading, error } = useData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <UserPanel data={data} />
      </Card>
    </div>
  );
};`,

  userPanel: `import { User } from '@/types';

interface UserPanelProps {
  data: User[];
}

export const UserPanel = ({ data }: UserPanelProps) => {
  return (
    <div className="space-y-4">
      {data.map((user) => (
        <div key={user.id} className="border p-4 rounded">
          <h3 className="font-semibold">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      ))}
    </div>
  );
};`,

  hook: `import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';

export const useData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get('/data');
        setData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};`,

  types: `export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';`
};
