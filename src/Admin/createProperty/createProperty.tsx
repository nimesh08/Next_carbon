import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressItem, ProgressManager } from "./progress";
import { Update, UpdateManager } from "./updates";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function CreatePropertyForm() {
  const [progress,] = useState<ProgressItem[]>([]);
  const [updates,] = useState<Update[]>([]);
  type Highlight = { highlight: string };
  const [formData, setFormData] = useState({
    name: "",
    status: "",
    price: "",
    available_shares: "",
    location: "",
    type: "",
    growth: "",
    description: "",
    image: null as File | null,
    progress: progress,
    updates: updates,
    Highlights: [] as Highlight[],
    attributes: {
      sharePerNFT: 0,
      initialSharePrice: 0,
      initialPropertyValue: 0,
    },
    value_parameters: {
      roi: 0,
      appreciation: 0,
      rentalYield: 0,
    }
  });
  const [uploading, setUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, image: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    toast.loading("Creating property...", { id: "create-property" });
    e.preventDefault();
    setUploading(true);

    let imageUrl = "";

    if (formData.image) {
      const file = formData.image;
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `properties/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("project_images")
        .upload(filePath, file);

      if (uploadError) {
        console.log({ "Image upload failed": uploadError.message });
        setUploading(false);
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from("project_images")
        .getPublicUrl(filePath);

      imageUrl = publicUrl.publicUrl;
    }

    const { error } = await supabase
      .from("property_data")
      .insert({
        name: formData.name,
        status: formData.status,
        price: Number(formData.price),
        available_shares: Number(formData.available_shares),
        totalShares: Number(formData.available_shares),
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
      });

    if (error) {
      toast.error("Error creating property", {
        id: "create-property",
      });
      setUploading(false);
      return;
    }

    toast.success("Property Created Successfully", {
      id: "create-property",
    });
    setFormData({
      name: "",
      status: "",
      price: "",
      available_shares: "",
      location: "",
      type: "",
      growth: "",
      description: "",
      image: null,
      progress: [],
      updates: [],
      Highlights: [],
      attributes: {
        sharePerNFT: 0,
        initialSharePrice: 0,
        initialPropertyValue: 0,
      },
      value_parameters: {
        roi: 0,
        appreciation: 0,
        rentalYield: 0,
      }
    });
    setUploading(false);
  };

  return (
    <div className="max-w-5xl mx-auto md:px-4 py-8">
      <Card className="shadow-xl">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-2xl font-bold">Create New Property</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Property Name</Label>
                <Input name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="status">Property Status</Label>
                <Select required name="status" value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
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
                <Input type="number" name="price" value={formData.price} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="available_shares">Available Shares</Label>
                <Input type="number" name="available_shares" value={formData.available_shares} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input name="location" value={formData.location} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="type">Property Type</Label>
                <Input name="type" value={formData.type} onChange={handleChange} required />
              </div>
            </div>
            <div>
              <Label htmlFor="growth">Growth Info</Label>
              <Input name="growth" value={formData.growth} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea name="description" value={formData.description} onChange={handleChange} rows={4} />
            </div>
            <div>
              <Label htmlFor="image">Property Image</Label>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
            </div>

            <ProgressManager
              progress={formData.progress}
              onChange={(progress) => setFormData(prev => ({ ...prev, progress }))}
            />
            <UpdateManager updates={formData.updates} onChange={(updates) => setFormData(prev => ({ ...prev, updates }))} />
            <Separator />

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-base">Highlights</Label>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() =>
                    setFormData(prev => ({ ...prev, Highlights: [...prev.Highlights, { highlight: "" }] }))
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
                          setFormData(prev => {
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
                          setFormData(prev => ({
                            ...prev,
                            Highlights: prev.Highlights.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="property_attributes" className="text-base">Property Attributes</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="sharePerNFT">Share Per NFT</Label>
                  <Input
                    type="number"
                    name="sharePerNFT"
                    value={formData.attributes.sharePerNFT}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      attributes: { ...prev.attributes, sharePerNFT: Number(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="initialSharePrice">Initial Share Price (USD)</Label>
                  <Input
                    type="number"
                    name="initialSharePrice"
                    value={formData.attributes.initialSharePrice}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      attributes: { ...prev.attributes, initialSharePrice: Number(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="initialPropertyValue">Initial Property Value (USD)</Label>
                  <Input
                    type="number"
                    name="initialPropertyValue"
                    value={formData.attributes.initialPropertyValue}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      attributes: { ...prev.attributes, initialPropertyValue: Number(e.target.value) }
                    }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium">Value Parameters</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="roi">ROI (%)</Label>
                  <Input
                    type="number"
                    name="roi"
                    value={formData.value_parameters.roi}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      value_parameters: { ...prev.value_parameters, roi: Number(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="appreciation">Appreciation (%)</Label>
                  <Input
                    type="number"
                    name="appreciation"
                    value={formData.value_parameters.appreciation}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      value_parameters: { ...prev.value_parameters, appreciation: Number(e.target.value) }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="rentalYield">Rental Yield (%)</Label>
                  <Input
                    type="number"
                    name="rentalYield"
                    value={formData.value_parameters.rentalYield}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      value_parameters: { ...prev.value_parameters, rentalYield: Number(e.target.value) }
                    }))}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? "Uploading..." : "Create Property"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}