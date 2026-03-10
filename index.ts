export interface Project {
    created_at: string;
    name: string;
    status: "launchpad" | "trading";
    price: number;
    available_shares: number;
    location: string;
    type: string;
    image: string;
    attributes?: Record<string, undefined>;
    value_parameters?: undefined[];
    updates?: undefined[];
    id: string;
    growth: string;
    description: string;
    token_address?: string;
    weight?: number;
    is_mature?: boolean;
    maturity_percentage?: number;
  }