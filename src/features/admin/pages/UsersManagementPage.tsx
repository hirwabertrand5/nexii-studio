import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/shared/ui/table';
import { Search, Ban, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminUsersApi } from '../api/adminApi';

interface User {
  _id: string;
  fullName: string;
  email: string;
  country?: string;
  accountStatus: 'active' | 'suspended';
  createdAt: string;
}

export default function UsersManagement() {
  const [userList, setUserList] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const [usersRes, statsRes] = await Promise.all([
          adminUsersApi.getAllUsers({ limit: 100, role: 'buyer' }),
          adminUsersApi.getUserStatistics()
        ]);
        
        if (usersRes.success) {
          setUserList(usersRes.data.users);
        }
        if (statsRes.success) {
          setStats(statsRes.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = userList.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.country && user.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleToggleStatus = async (userId: string, currentStatus: 'active' | 'suspended') => {
    try {
      if (currentStatus === 'active') {
        await adminUsersApi.suspendUser(userId);
        toast.success('User suspended');
      } else {
        await adminUsersApi.activateUser(userId);
        toast.success('User activated');
      }
      
      setUserList(userList.map(user => 
        user._id === userId 
          ? { ...user, accountStatus: currentStatus === 'active' ? 'suspended' : 'active' }
          : user
      ));
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error loading users: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Users Management</h1>
        <p className="text-muted-foreground">
          {filteredUsers.length} users displayed
        </p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users by name, email, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-mono text-sm">{user._id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-semibold">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.country || '-'}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.accountStatus === 'active' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.accountStatus.charAt(0).toUpperCase() + user.accountStatus.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant={user.accountStatus === 'active' ? 'ghost' : 'default'}
                          size="sm"
                          onClick={() => handleToggleStatus(user._id, user.accountStatus)}
                        >
                          {user.accountStatus === 'active' ? (
                            <>
                              <Ban className="w-4 h-4 mr-1" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Users</p>
            <p className="text-2xl font-bold">{(stats?.activeUsers ?? 0) + (stats?.suspendedUsers ?? 0)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Active Users</p>
            <p className="text-2xl font-bold">
              {stats?.activeUsers ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Suspended Users</p>
            <p className="text-2xl font-bold">
              {userList.reduce((sum, user) => sum + user.totalPurchases, 0)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
