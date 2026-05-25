interface RequestConfig extends RequestInit {
  baseUrl?: string;
  params?: Record<string, string | number>;
  timeout?: number;
}

// Cliente HTTP customizado para simplificar chamadas fetch com timeout e parametrização
export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string, opts?: { headers?: Record<string, string> }) {
    this.baseUrl = baseURL;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...opts?.headers,
    };
  }

  // Método genérico para executar requisições HTTP
  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const {
      method = "GET",
      params,
      body,
      headers,
      timeout = 30000,
      ...rest
    } = config;

    const url = new URL(`${this.baseUrl}${endpoint}`);
    // Adiciona parâmetros de consulta (query params) à URL, se existirem
    if (params) {
      Object.entries(params).forEach(([key, value]) =>
        url.searchParams.append(key, value.toString()),
      );
    }

    // Configuração de timeout usando AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url.toString(), {
        ...rest,
        method,
        headers: { ...this.defaultHeaders, ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Trata erros de status HTTP (não-2xx)
      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({}))) as Record<string, string>;
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Tempo de requisição esgotado");
      }
      throw error;
    }
  }

  // Atalho para requisições GET
  get<T>(
    url: string,
    params?: RequestConfig["params"],
    config?: RequestConfig,
  ) {
    return this.request<T>(url, { ...config, method: "GET", params });
  }

  // Atalho para requisições POST
  post<T>(url: string, body?: any, config?: RequestConfig) {
    return this.request<T>(url, { ...config, method: "POST", body });
  }
}
