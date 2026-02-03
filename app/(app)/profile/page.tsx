'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Trash2, Smartphone, Monitor } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

type Device = {
    name: string;
    os: string;
    osVersion: string;
    _id?: string;
};

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<Device[]>([]);

    // New Device State
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
    const [newDevice, setNewDevice] = useState<Device>({ name: '', os: 'Android', osVersion: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setName(data.name);
                setDevices(data.devices || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const router = useRouter();

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (res.ok) {
                toast.success("Profile updated successfully");
                fetchProfile(); // refresh local state
                router.refresh(); // refresh server components (Header)
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to update profile");
        }
    };

    const handleAddDevice = async () => {
        if (!newDevice.name || !newDevice.os || !newDevice.osVersion) return;

        const updatedDevices = [...devices, newDevice];

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ devices: updatedDevices }),
            });

            if (res.ok) {
                setDevices(updatedDevices);
                setIsDeviceModalOpen(false);
                setNewDevice({ name: '', os: 'Android', osVersion: '' });
                toast.success('Device added successfully');
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to add device');
        }
    };

    const handleRemoveDevice = async (indexToRemove: number) => {
        const updatedDevices = devices.filter((_, index) => index !== indexToRemove);

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ devices: updatedDevices }),
            });

            if (res.ok) {
                setDevices(updatedDevices);
                toast.success('Device removed successfully');
            }
        } catch (e) {
            console.error(e);
            toast.error('Failed to remove device');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
                <p className="text-muted-foreground">Manage your account settings and test devices.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-[1fr,1.5fr]">
                {/* Left Column: User Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center space-y-4">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={user?.image} />
                                    <AvatarFallback className="text-2xl">{user?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="text-center">
                                    <p className="font-medium text-lg">{user?.username}</p>
                                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                                    <Badge variant="secondary" className="mt-2 capitalize">{user?.role}</Badge>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                                <Button type="submit" size="sm" className="w-full">Update Info</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Devices */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <div>
                                <CardTitle>Test Devices</CardTitle>
                                <CardDescription className="mt-1">Manage devices you use for testing.</CardDescription>
                            </div>
                            <Dialog open={isDeviceModalOpen} onOpenChange={setIsDeviceModalOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="gap-1">
                                        <Plus className="h-4 w-4" /> Add Device
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Device</DialogTitle>
                                        <DialogDescription>
                                            Enter the details of the device you will be testing on.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="device-name">Device Name</Label>
                                            <Input
                                                id="device-name"
                                                placeholder="e.g. iPhone 13, Galaxy S21"
                                                value={newDevice.name}
                                                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="os">OS</Label>
                                                <Select
                                                    value={newDevice.os}
                                                    onValueChange={(val) => setNewDevice({ ...newDevice, os: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select OS" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="iOS">iOS</SelectItem>
                                                        <SelectItem value="Android">Android</SelectItem>
                                                        <SelectItem value="Windows">Windows</SelectItem>
                                                        <SelectItem value="macOS">macOS</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="os-version">Version</Label>
                                                <Input
                                                    id="os-version"
                                                    placeholder="e.g. 15.0, 12"
                                                    value={newDevice.osVersion}
                                                    onChange={(e) => setNewDevice({ ...newDevice, osVersion: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsDeviceModalOpen(false)}>Cancel</Button>
                                        <Button onClick={handleAddDevice}>Add Device</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {devices.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No devices added yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {devices.map((device, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card/50 hover:bg-accent/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <Smartphone className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{device.name}</p>
                                                    <p className="text-xs text-muted-foreground">{device.os} {device.osVersion}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemoveDevice(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
