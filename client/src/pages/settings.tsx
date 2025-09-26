import { useState } from "react";
import { useAuth } from "@/App";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const LOCATIONS = [
  { value: "mumbai", label: "Mumbai, India" },
  { value: "delhi", label: "Delhi, India" },
  { value: "bangalore", label: "Bangalore, India" },
  { value: "chennai", label: "Chennai, India" },
  { value: "kolkata", label: "Kolkata, India" },
  { value: "pune", label: "Pune, India" },
  { value: "hyderabad", label: "Hyderabad, India" },
  { value: "other", label: "Other" },
];

const TARGET_MARKETS = [
  { value: "national", label: "India (National)" },
  { value: "regional", label: "Regional (West India)" },
  { value: "local", label: "Local (Mumbai Metro)" },
];

export default function Settings() {
  const user = { 
    id: "demo-user", 
    firstName: "Demo", 
    lastName: "User", 
    email: "demo@example.com", 
    businessName: "Demo Store",
    location: "mumbai", 
    subscriptionTier: "free" 
  }; // Mock user for demo
  const login = () => {}; // No-op for demo
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    businessName: user?.businessName || "",
    location: user?.location || "",
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    priceAlerts: true,
    trendAlerts: false,
    targetMarket: "national",
    shareUsageData: true,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user?.id) throw new Error("User not found");
      const response = await apiRequest("PATCH", `/api/user/${user.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      login(updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfileData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleLocationChange = (value: string) => {
    setProfileData(prev => ({ ...prev, location: value }));
  };

  const handlePreferenceChange = (field: string) => (checked: boolean) => {
    setPreferences(prev => ({ ...prev, [field]: checked }));
  };

  const handleDeleteAccount = () => {
    // In a real app, this would call an API to delete the account
    toast({
      title: "Account deletion",
      description: "This feature is not available in the demo version.",
      variant: "destructive",
    });
  };

  const handleExportData = () => {
    // In a real app, this would trigger a data export
    toast({
      title: "Data export",
      description: "Your data export has been initiated. You'll receive an email when ready.",
    });
  };

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const response = await fetch("/api/products/import-csv", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Import successful",
          description: result.message,
        });
      } else {
        throw new Error(result.message || "Failed to import CSV");
      }
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setCsvFile(null);
      const fileInput = document.getElementById('csvFile') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold" data-testid="text-pageTitle">
              Settings
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage your account preferences and configurations
            </p>
          </div>
        </header>

        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Profile Settings
                  <Badge variant="secondary">{user?.subscriptionTier}</Badge>
                </CardTitle>
                <CardDescription>
                  Update your personal information and business details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={handleInputChange("firstName")}
                        data-testid="input-firstName"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={handleInputChange("lastName")}
                        data-testid="input-lastName"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={handleInputChange("email")}
                        data-testid="input-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={profileData.businessName}
                        onChange={handleInputChange("businessName")}
                        data-testid="input-businessName"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Primary Location</Label>
                    <Select value={profileData.location} onValueChange={handleLocationChange}>
                      <SelectTrigger data-testid="select-location">
                        <SelectValue placeholder="Select your location" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATIONS.map((location) => (
                          <SelectItem key={location.value} value={location.value}>
                            {location.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Configure how you want to receive updates and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive daily analytics reports and insights
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={handlePreferenceChange("emailNotifications")}
                    data-testid="switch-email-notifications"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Price Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified of significant price changes in your tracked products
                    </p>
                  </div>
                  <Switch
                    checked={preferences.priceAlerts}
                    onCheckedChange={handlePreferenceChange("priceAlerts")}
                    data-testid="switch-price-alerts"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Trend Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when products start trending in your market
                    </p>
                  </div>
                  <Switch
                    checked={preferences.trendAlerts}
                    onCheckedChange={handlePreferenceChange("trendAlerts")}
                    data-testid="switch-trend-alerts"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location & Demographics */}
            <Card>
              <CardHeader>
                <CardTitle>Location & Demographics</CardTitle>
                <CardDescription>
                  Configure your target market and regional preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Markets</Label>
                  <Select 
                    value={preferences.targetMarket} 
                    onValueChange={(value) => setPreferences(prev => ({ ...prev, targetMarket: value }))}
                  >
                    <SelectTrigger data-testid="select-target-market">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_MARKETS.map((market) => (
                        <SelectItem key={market.value} value={market.value}>
                          {market.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Import and export your product data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="csvFile" className="mb-2 block">Import Products from CSV</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="flex-grow"
                      data-testid="input-csv-file"
                    />
                    <Button
                      onClick={handleCsvImport}
                      disabled={isUploading || !csvFile}
                      data-testid="button-import-csv"
                    >
                      {isUploading ? "Uploading..." : "Import CSV"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload a CSV file with your product data. The file should include columns: name, category, brand, price, rating, stock, salesVolume, profitMargin.
                  </p>
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    data-testid="button-export-data"
                  >
                    Download My Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Manage your privacy and account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Share Anonymous Usage Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve our AI models with anonymized usage patterns
                    </p>
                  </div>
                  <Switch
                    checked={preferences.shareUsageData}
                    onCheckedChange={handlePreferenceChange("shareUsageData")}
                    data-testid="switch-share-usage"
                  />
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row gap-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        data-testid="button-delete-account"
                      >
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
