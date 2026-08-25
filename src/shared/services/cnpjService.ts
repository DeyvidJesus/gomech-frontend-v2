import axios from 'axios';

export interface CnpjResponseData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  email?: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  situacaoCadastral?: string;
}

export interface CepResponseData {
  cep: string;
  logradouro: string;
  bairro: string;
  municipio: string;
  uf: string;
}

export const cnpjService = {
  /**
   * Fetches company data from Receita Federal via BrasilAPI.
   */
  async fetchByCnpj(cnpj: string): Promise<CnpjResponseData | null> {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      return null;
    }

    try {
      const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
        timeout: 8000,
      });

      const data = response.data;
      if (!data) return null;

      let phone = '';
      if (data.ddd_telefone_1) {
        phone = data.ddd_telefone_1.replace(/\s+/g, '');
        if (phone.length === 10) {
          phone = `(${phone.substring(0, 2)}) ${phone.substring(2, 6)}-${phone.substring(6)}`;
        } else if (phone.length === 11) {
          phone = `(${phone.substring(0, 2)}) ${phone.substring(2, 7)}-${phone.substring(7)}`;
        }
      }

      return {
        cnpj: cleanCnpj,
        razaoSocial: data.razao_social || data.nome_empresarial || '',
        nomeFantasia: data.nome_fantasia || data.razao_social || '',
        email: data.email ? data.email.toLowerCase() : '',
        telefone: phone,
        cep: data.cep ? data.cep.replace(/\D/g, '') : '',
        logradouro: [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(' ') || data.logradouro || '',
        numero: data.numero || '',
        bairro: data.bairro || '',
        municipio: data.municipio || '',
        uf: data.uf || '',
        situacaoCadastral: data.descricao_situacao_cadastral || '',
      };
    } catch (error) {
      console.warn('Erro ao consultar CNPJ na Receita Federal via BrasilAPI:', error);
      return null;
    }
  },

  /**
   * Fetches address from CEP via BrasilAPI.
   */
  async fetchByCep(cep: string): Promise<CepResponseData | null> {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return null;
    }

    try {
      const response = await axios.get(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`, {
        timeout: 5000,
      });
      const data = response.data;
      if (!data) return null;

      return {
        cep: cleanCep,
        logradouro: data.street || '',
        bairro: data.neighborhood || '',
        municipio: data.city || '',
        uf: data.state || '',
      };
    } catch (error) {
      // Fallback to viacep
      try {
        const viacep = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`, { timeout: 4000 });
        if (viacep.data && !viacep.data.erro) {
          return {
            cep: cleanCep,
            logradouro: viacep.data.logradouro || '',
            bairro: viacep.data.bairro || '',
            municipio: viacep.data.localidade || '',
            uf: viacep.data.uf || '',
          };
        }
      } catch (e) {
        console.warn('Erro ao consultar CEP:', e);
      }
      return null;
    }
  },
};
