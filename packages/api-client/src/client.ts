import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  MeResponse,
  SwitchOrgRequest,
  SwitchOrgResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  CreateOrgRequest,
  CreateOrgResponse,
  OrgDetailResponse,
  AddOrgMemberRequest,
  AddOrgMemberResponse,
  UpdateOrgMemberRequest,
  UpdateOrgMemberResponse,
} from '@listforge/api-types';

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = process.env.API_URL || 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      })) as { message?: string };
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async me(): Promise<MeResponse> {
    return this.request<MeResponse>('/auth/me');
  }

  async switchOrg(data: SwitchOrgRequest): Promise<SwitchOrgResponse> {
    return this.request<SwitchOrgResponse>('/auth/switch-org', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // User endpoints
  async updateUser(
    userId: string,
    data: UpdateUserRequest,
  ): Promise<UpdateUserResponse> {
    return this.request<UpdateUserResponse>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Organization endpoints
  async listOrgs(): Promise<{ orgs: CreateOrgResponse['org'][] }> {
    return this.request<{ orgs: CreateOrgResponse['org'][] }>('/orgs');
  }

  async createOrg(data: CreateOrgRequest): Promise<CreateOrgResponse> {
    return this.request<CreateOrgResponse>('/orgs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrg(orgId: string): Promise<OrgDetailResponse> {
    return this.request<OrgDetailResponse>(`/orgs/${orgId}`);
  }

  async addOrgMember(
    orgId: string,
    data: AddOrgMemberRequest,
  ): Promise<AddOrgMemberResponse> {
    return this.request<AddOrgMemberResponse>(`/orgs/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrgMember(
    orgId: string,
    userId: string,
    data: UpdateOrgMemberRequest,
  ): Promise<UpdateOrgMemberResponse> {
    return this.request<UpdateOrgMemberResponse>(
      `/orgs/${orgId}/members/${userId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    );
  }
}

