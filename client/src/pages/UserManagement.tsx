import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Edit,
  Trash2,
  UserPlus,
  User,
  Lock
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';

// Interface for the user's profile data
interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roleId: number;
  isActive: boolean;
  profileImageUrl: string | null;
}

// Interface for role data
interface Role {
  id: number;
  name: string;
  description: string | null;
}

const UserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProfileImageDialogOpen, setIsProfileImageDialogOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState('');

  // Query to fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserProfile[]>({
    queryKey: ['/api/users'],
  });

  // Query to fetch roles
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery<Role[]>({
    queryKey: ['/api/roles'],
  });

  // Mutation to update user
  const updateUserMutation = useMutation({
    mutationFn: async (updatedUser: Partial<UserProfile>) => {
      const response = await fetch(`/api/users/${selectedUser?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditDialogOpen(false);
      toast({
        title: 'User Updated',
        description: 'The user has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update user: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation to update user's profile image
  const updateProfileImageMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${selectedUser?.id}/profile-image`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImageUrl }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsProfileImageDialogOpen(false);
      toast({
        title: 'Profile Image Updated',
        description: 'The profile image has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update profile image: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Mutation to delete user
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${selectedUser?.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: 'User Deleted',
        description: 'The user has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete user: ${error}`,
        variant: 'destructive',
      });
    },
  });

  // Handle opening the edit dialog
  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  // Handle opening the delete dialog
  const handleDeleteUser = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Handle opening the profile image dialog
  const handleEditProfileImage = (user: UserProfile) => {
    setSelectedUser(user);
    setProfileImageUrl(user.profileImageUrl || '');
    setIsProfileImageDialogOpen(true);
  };

  // Form submit handler for editing user
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const userData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      roleId: parseInt(formData.get('roleId') as string),
      isActive: formData.get('isActive') === 'true',
    };
    
    updateUserMutation.mutate(userData);
  };

  // Form submit handler for changing profile image
  const handleProfileImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileImageUrl) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid image URL',
        variant: 'destructive',
      });
      return;
    }
    
    updateProfileImageMutation.mutate();
  };

  // Get role name by ID
  const getRoleName = (roleId: number) => {
    const role = roles.find((r: Role) => r.id === roleId);
    return role ? role.name : 'Unknown Role';
  };

  // Generate avatar initials from user name
  const getInitials = (firstName: string | null, lastName: string | null) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (lastName) {
      return lastName[0].toUpperCase();
    } else {
      return 'U';
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">User Management</TabsTrigger>
          {/* Add more tabs as needed for future functionality */}
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">User Management</CardTitle>
              <CardDescription>
                Manage the users of the salon booking system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers || isLoadingRoles ? (
                <div className="flex justify-center p-4">Loading users...</div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profile</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: UserProfile) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Avatar className="cursor-pointer" onClick={() => handleEditProfileImage(user)}>
                              {user.profileImageUrl ? (
                                <AvatarImage src={user.profileImageUrl} />
                              ) : null}
                              <AvatarFallback>
                                {getInitials(user.firstName, user.lastName)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell>{user.firstName} {user.lastName}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{getRoleName(user.roleId)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleDeleteUser(user)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[475px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    name="firstName" 
                    defaultValue={selectedUser?.firstName || ''}
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    name="lastName" 
                    defaultValue={selectedUser?.lastName || ''}
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  defaultValue={selectedUser?.email || ''}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="roleId">Role</Label>
                <Select name="roleId" defaultValue={selectedUser?.roleId.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="isActive">Status</Label>
                <Select name="isActive" defaultValue={selectedUser?.isActive ? 'true' : 'false'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Profile Image Dialog */}
      <Dialog open={isProfileImageDialogOpen} onOpenChange={setIsProfileImageDialogOpen}>
        <DialogContent className="sm:max-w-[475px]">
          <DialogHeader>
            <DialogTitle>Update Profile Image</DialogTitle>
            <DialogDescription>
              Enter the URL of the new profile image.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProfileImageSubmit}>
            <div className="grid gap-4 py-4">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  {profileImageUrl ? (
                    <AvatarImage src={profileImageUrl} />
                  ) : null}
                  <AvatarFallback className="text-2xl">
                    {selectedUser && getInitials(selectedUser.firstName, selectedUser.lastName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="profileImageUrl">Image URL</Label>
                <Input 
                  id="profileImageUrl" 
                  value={profileImageUrl}
                  onChange={(e) => setProfileImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsProfileImageDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateProfileImageMutation.isPending}
              >
                {updateProfileImageMutation.isPending ? 'Saving...' : 'Update Image'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p><strong>Username:</strong> {selectedUser?.username}</p>
            <p><strong>Email:</strong> {selectedUser?.email}</p>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => deleteUserMutation.mutate()}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;