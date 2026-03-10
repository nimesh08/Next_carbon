import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ProgressItem, ProgressManager } from "../createProperty/progress";
import { Update, UpdateManager } from "../createProperty/updates";
import { Search, Edit, Save, X, RefreshCw } from "lucide-react";

interface PropertyData {
  id: string;
  name: string;
  status: string;
  price: number;
  available_shares: number;
  location: string;
  type: string;
  growth: string;
  description: string;
  image: string | File;
  progress: ProgressItem[];
  updates: Update[];
  Highlights: Highlight[];
  attributes: {
    sharePerNFT: number;
    initialSharePrice: number;
    initialPropertyValue: number;
  };
  value_parameters: {
    roi: number;
    appreciation: number;
    rentalYield: number;
  };
  created_at: string;
}

type Highlight = { highlight: string };

const ManageProperty = () => {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState<PropertyData | null>(null);

  // Fetch all properties
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("property_data")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching properties:", error);
        throw error;
      }

      // console.log("Raw properties data from database:", data);

      // Parse JSON fields robustly (handle arrays, objects, or null)
      const parsedData = data.map((property) => {
        const defaultAttributes = {
          sharePerNFT: 0,
          initialSharePrice: 0,
          initialPropertyValue: 0,
        };
        const defaultValueParams = { roi: 0, appreciation: 0, rentalYield: 0 };

        const attributes = Array.isArray(property.attributes)
          ? property.attributes[0] ?? defaultAttributes
          : property.attributes && typeof property.attributes === "object"
          ? property.attributes
          : defaultAttributes;

        const valueParameters = Array.isArray(property.value_parameters)
          ? property.value_parameters[0] ?? defaultValueParams
          : property.value_parameters &&
            typeof property.value_parameters === "object"
          ? property.value_parameters
          : defaultValueParams;

        return {
          ...property,
          progress: Array.isArray(property.progress) ? property.progress : [],
          updates: Array.isArray(property.updates) ? property.updates : [],
          Highlights: Array.isArray(property.Highlights)
            ? property.Highlights
            : [],
          attributes,
          value_parameters: valueParameters,
        };
      });

      console.log("Parsed properties data:", parsedData);
      setProperties(parsedData);
    } catch (error: unknown) {
      console.error("Error fetching properties:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to fetch properties: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Filter properties based on search and status
  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle property selection
  const handleSelectProperty = (property: PropertyData) => {
    setSelectedProperty(property);
    setFormData({ ...property });
  };

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
    }
  };

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (formData && file) {
      setFormData((prev) => (prev ? { ...prev, image: file as File } : null));
    }
  };

  // Handle update submission
  const handleUpdate = async () => {
    if (!formData || !selectedProperty) return;

    setUpdating(true);
    toast.loading("Updating property...", { id: "update-property" });

    try {
      let imageUrl: string =
        typeof formData.image === "string" ? formData.image : "";

      // If a new image file is selected, upload it
      if (formData.image && formData.image instanceof File) {
        const file = formData.image;
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `properties/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("project_images")
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicUrl } = supabase.storage
          .from("project_images")
          .getPublicUrl(filePath);

        imageUrl = publicUrl.publicUrl;
      }

      // Prepare update data
      const updateData = {
        name: formData.name,
        status: formData.status,
        price: Number(formData.price),
        available_shares: Number(formData.available_shares),
        location: formData.location,
        type: formData.type,
        growth: formData.growth,
        description: formData.description,
        image: imageUrl,
        progress: formData.progress,
        updates: formData.updates,
        Highlights: formData.Highlights,
        attributes: [formData.attributes],
        value_parameters: [formData.value_parameters],
      };

      console.log("Updating property with data:", updateData);
      console.log("Property ID:", selectedProperty.id);

      const { data, error } = await supabase
        .from("property_data")
        .update(updateData)
        .eq("id", selectedProperty.id)
        .select();

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      console.log("Update result:", data);

      toast.success("Property updated successfully", { id: "update-property" });

      // Refresh properties list
      await fetchProperties();

      // Update selected property with the returned data
      if (data && data.length > 0) {
        const returned = data[0] as Record<string, unknown>;
        const defaultAttributes = {
          sharePerNFT: 0,
          initialSharePrice: 0,
          initialPropertyValue: 0,
        };
        const defaultValueParams = { roi: 0, appreciation: 0, rentalYield: 0 };
        const rawAttributes = returned["attributes"];
        const attributes = Array.isArray(rawAttributes)
          ? rawAttributes[0] ?? defaultAttributes
          : rawAttributes && typeof rawAttributes === "object"
          ? rawAttributes
          : defaultAttributes;
        const rawValueParams = returned["value_parameters"];
        const valueParameters = Array.isArray(rawValueParams)
          ? rawValueParams[0] ?? defaultValueParams
          : rawValueParams && typeof rawValueParams === "object"
          ? rawValueParams
          : defaultValueParams;
        const highlights = Array.isArray(returned["Highlights"])
          ? (returned["Highlights"] as unknown[])
          : [];
        const updatedProperty = {
          ...(returned as object),
          progress: Array.isArray(returned["progress"])
            ? (returned["progress"] as unknown[])
            : [],
          updates: Array.isArray(returned["updates"])
            ? (returned["updates"] as unknown[])
            : [],
          Highlights: highlights as Highlight[],
          attributes,
          value_parameters: valueParameters,
        } as PropertyData;
        setSelectedProperty(updatedProperty);
        setFormData(updatedProperty);
      }
    } catch (error: unknown) {
      console.error("Error updating property:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to update property: ${message}`, {
        id: "update-property",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Reset form
  const handleReset = () => {
    if (selectedProperty) {
      setFormData({ ...selectedProperty });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Properties</h1>
        <Button onClick={fetchProperties} variant="outline" disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Selection Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Select Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="space-y-3">
                <Input
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="launchpad">Launchpad</SelectItem>
                    <SelectItem value="trading">Trading</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Properties List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-4">Loading properties...</div>
                ) : filteredProperties.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No properties found
                  </div>
                ) : (
                  filteredProperties.map((property) => (
                    <Card
                      key={property.id}
                      className={`cursor-pointer transition-colors ${
                        selectedProperty?.id === property.id
                          ? "ring-2 ring-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleSelectProperty(property)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">
                              {property.name}
                            </h3>
                            <Badge
                              variant={
                                property.status === "trading"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {property.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {property.location}
                          </p>
                          <p className="text-sm font-medium">
                            ${property.price.toLocaleString()}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Property Edit Form */}
        <div className="lg:col-span-2">
          {selectedProperty && formData ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Edit Property: {selectedProperty.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdate();
                  }}
                  className="space-y-4"
                >
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Property Name</Label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Property Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData((prev) =>
                            prev ? { ...prev, status: value } : null
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Status</SelectLabel>
                            <SelectItem value="launchpad">Launchpad</SelectItem>
                            <SelectItem value="trading">Trading</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="price">Price (USD)</Label>
                      <Input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="available_shares">Available Shares</Label>
                      <Input
                        type="number"
                        name="available_shares"
                        value={formData.available_shares}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Property Type</Label>
                      <Input
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="growth">Growth Info</Label>
                    <Input
                      name="growth"
                      value={formData.growth}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="image">Property Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {formData.image && typeof formData.image === "string" && (
                      <div className="mt-2">
                        <img
                          src={formData.image}
                          alt="Current property"
                          className="w-32 h-32 object-cover rounded-md"
                        />
                      </div>
                    )}
                    {formData.image && formData.image instanceof File && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          New image selected: {formData.image.name}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Progress Management */}
                  <ProgressManager
                    progress={formData.progress}
                    onChange={(progress) =>
                      setFormData((prev) =>
                        prev ? { ...prev, progress } : null
                      )
                    }
                  />

                  {/* Updates Management */}
                  <UpdateManager
                    updates={formData.updates}
                    onChange={(updates) =>
                      setFormData((prev) =>
                        prev ? { ...prev, updates } : null
                      )
                    }
                  />

                  <Separator />

                  {/* Highlights */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Highlights</Label>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) =>
                            prev
                              ? { ...prev, Highlights: [...prev.Highlights, { highlight: "" }] }
                              : null
                          )
                        }
                      >
                        Add Highlight
                      </Button>
                    </div>
                    {formData.Highlights.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic mt-2">No highlights added yet.</p>
                    ) : (
                      <div className="space-y-3 mt-3">
                        {formData.Highlights.map((h, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Input
                              placeholder={`Highlight ${idx + 1}`}
                              value={h.highlight}
                              onChange={(e) =>
                                setFormData((prev) => {
                                  if (!prev) return prev;
                                  const next = [...prev.Highlights];
                                  next[idx] = { highlight: e.target.value };
                                  return { ...prev, Highlights: next };
                                })
                              }
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setFormData((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        Highlights: prev.Highlights.filter((_, i) => i !== idx),
                                      }
                                    : null
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Property Attributes */}
                  <div>
                    <Label className="text-base">Property Attributes</Label>
                    <div className="grid gap-4 md:grid-cols-2 mt-2">
                      <div>
                        <Label htmlFor="sharePerNFT">Share Per NFT</Label>
                        <Input
                          type="number"
                          value={formData.attributes.sharePerNFT}
                          onChange={(e) =>
                            setFormData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    attributes: {
                                      ...prev.attributes,
                                      sharePerNFT: Number(e.target.value),
                                    },
                                  }
                                : null
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="initialSharePrice">
                          Initial Share Price (USD)
                        </Label>
                        <Input
                          type="number"
                          value={formData.attributes.initialSharePrice}
                          onChange={(e) =>
                            setFormData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    attributes: {
                                      ...prev.attributes,
                                      initialSharePrice: Number(e.target.value),
                                    },
                                  }
                                : null
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="initialPropertyValue">
                          Initial Property Value (USD)
                        </Label>
                        <Input
                          type="number"
                          value={formData.attributes.initialPropertyValue}
                          onChange={(e) =>
                            setFormData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    attributes: {
                                      ...prev.attributes,
                                      initialPropertyValue: Number(
                                        e.target.value
                                      ),
                                    },
                                  }
                                : null
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Value Parameters */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      Value Parameters
                    </h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <Label htmlFor="roi">ROI (%)</Label>
                        <Input
                          type="number"
                          value={formData.value_parameters.roi}
                          onChange={(e) =>
                            setFormData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    value_parameters: {
                                      ...prev.value_parameters,
                                      roi: Number(e.target.value),
                                    },
                                  }
                                : null
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="appreciation">Appreciation (%)</Label>
                        <Input
                          type="number"
                          value={formData.value_parameters.appreciation}
                          onChange={(e) =>
                            setFormData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    value_parameters: {
                                      ...prev.value_parameters,
                                      appreciation: Number(e.target.value),
                                    },
                                  }
                                : null
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="rentalYield">Rental Yield (%)</Label>
                        <Input
                          type="number"
                          value={formData.value_parameters.rentalYield}
                          onChange={(e) =>
                            setFormData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    value_parameters: {
                                      ...prev.value_parameters,
                                      rentalYield: Number(e.target.value),
                                    },
                                  }
                                : null
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={updating}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updating ? "Updating..." : "Update Property"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={fetchProperties}
                      disabled={loading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                          loading ? "animate-spin" : ""
                        }`}
                      />
                      Refresh Data
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center text-muted-foreground">
                  <Edit className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a property to edit</p>
                  <p className="text-sm">
                    Choose a property from the list to view and update its
                    details
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageProperty;
