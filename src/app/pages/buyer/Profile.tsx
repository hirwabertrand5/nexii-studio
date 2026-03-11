import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { africanCountries } from '../../data/mockData';
import { toast } from 'sonner';

export default function BuyerProfile() {
  const [formData, setFormData] = useState({
    name: 'Kwame Mensah',
    email: 'kwame.mensah@email.com',
    country: 'Ghana',
    phone: '+233 24 123 4567',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile updated successfully!');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={formData.country} onValueChange={(value) => handleChange('country', value)}>
                    <SelectTrigger id="country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {africanCountries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" size="lg">
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>

                <Button type="submit" variant="outline">
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Account Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                <p className="font-semibold">February 15, 2026</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Purchases</p>
                <p className="font-semibold">2 Plans</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                <p className="font-semibold">$73,000</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Custom Requests</p>
                <p className="font-semibold">1 Active</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Need help? Contact our support team
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> support@nexii.com</p>
                <p><strong>Phone:</strong> +234 800 000 0000</p>
                <p><strong>Hours:</strong> Mon-Fri, 9AM-5PM WAT</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
