const axios = require('axios');

class XilnexService {
  constructor() {
    this.apiUrl = process.env.XILNEX_API_URL || 'https://api.xilnex.com';
    this.appId = process.env.XILNEX_APPID;
    this.token = process.env.XILNEX_APPTOKEN;
    this.auth = process.env.XILNEX_AUTH;
    this.enabled = process.env.XILNEX_ENABLED === 'true';
    
    // Debug logging for configuration
    console.log('🔧 XILNEX SERVICE CONFIGURATION:');
    console.log('  API URL:', this.apiUrl);
    console.log('  Enabled:', this.enabled);
    console.log('  App ID:', this.appId ? `${this.appId.substring(0, 8)}...` : 'NOT SET');
    console.log('  Token:', this.token ? `${this.token.substring(0, 16)}...` : 'NOT SET');
    console.log('  Auth:', this.auth || 'NOT SET');
    console.log('  Is Configured:', this.isEnabled());
    
    // Create axios instance with default config
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'appid': this.appId,
        'token': this.token,
        'auth': this.auth
      }
    });
    
    console.log('📡 Axios instance headers:', this.axiosInstance.defaults.headers);

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if Xilnex integration is enabled and configured
   */
  isEnabled() {
    const result = this.enabled && this.appId && this.token && this.auth;
    console.log('🔍 XILNEX isEnabled() check:');
    console.log('  enabled:', this.enabled);
    console.log('  appId:', !!this.appId, this.appId ? `(${this.appId.substring(0, 8)}...)` : '(missing)');
    console.log('  token:', !!this.token, this.token ? `(${this.token.substring(0, 16)}...)` : '(missing)');
    console.log('  auth:', !!this.auth, `(${this.auth})`);
    console.log('  final result:', result);
    return result;
  }

  /**
   * Map CRM outlet code to Xilnex outlet name by looking up the actual outlet data
   */
  async mapOutletToXilnexName(outletCode) {
    try {
      const Outlet = require('../models/Outlet');
      const outlet = await Outlet.findOne({ code: outletCode });
      
      if (outlet) {
        return outlet.name; // Use the actual outlet name from database
      }
      
      // Fallback to code if outlet not found
      return outletCode || 'Default Outlet';
    } catch (error) {
      return outletCode || 'Default Outlet';
    }
  }

  /**
   * Transform CRM contact data to Xilnex client format
   */
  async transformContactToXilnexClient(contact) {
    console.log('🔄 TRANSFORMING CONTACT TO XILNEX CLIENT');
    console.log('  Input contact:', JSON.stringify(contact, null, 2));
    
    const outletName = await this.mapOutletToXilnexName(contact.outlet);
    console.log('  Mapped outlet:', contact.outlet, '->', outletName);
    
    const clientData = {
      client: {
        buddyReferenceID: 0,
        buddyPoints: 0,
        lifetimePointValueToUpgrade: 0,
        lifetimePointValueToMaintain: 0,
        targetLifetimePointValueToUpgrade: 0,
        targetLifetimePointValueToMaintain: 0,
        id: parseInt(contact._id.toString().replace(/\D/g, '').slice(-4)) || 9001, // Extract numeric ID
        name: contact.fullName || `${contact.firstName} ${contact.lastName}`,
        alternateLookup: "",
        creditLimit: 0,
        code: (parseInt(contact._id.toString().replace(/\D/g, '').slice(-4)) || 9001).toString(),
        email: contact.email,
        type: "",
        registrationCode: "",
        dob: contact.birthdate ? new Date(contact.birthdate).toISOString() : new Date().toISOString(),
        firstName: contact.firstName,
        lastName: contact.lastName,
        mobile: contact.phone || "",
        active: true, // Set to true for new customers
        allowAllOutlets: true,
        gstInclusive: false,
        pointValue: 0,
        lifetimePointValue: 0,
        lastLifetimePointValue: 0,
        createdOutlet: outletName,
        pointFactor: 0,
        paymentTerms: 0,
        enableDOB: false,
        allowToReceiveMarketing: false,
        individualDiscount: 0,
        verified: false,
        purchaseLimit: 0,
        isActivatedBuddyReward: false,
        isActivatedBuddyReferenceReward: false,
        isActivatedStoreReferenceReward: false,
        floatingPointValue: 0,
        isAutoEmailReceipt: false,
        eLHDNIsForeign: false,
        priceMarkupPercentage: 0,
        controlledDiscountLimit: 0
      },
      isRequireGenerateXCard: false,
      isCreditTransferable: false
    };
    
    console.log('✅ TRANSFORMED CLIENT DATA:', JSON.stringify(clientData, null, 2));
    return clientData;
  }

  /**
   * Map CRM contact status to Xilnex client status
   */
  mapCrmStatusToXilnex(crmStatus) {
    const statusMap = {
      'lead': 'prospect',
      'prospect': 'prospect', 
      'customer': 'active',
      'inactive': 'inactive'
    };
    return statusMap[crmStatus] || 'prospect';
  }

  /**
   * Create a new client in Xilnex
   */
  async createClient(contact) {
    console.log('🆕 XILNEX CREATE CLIENT START');
    
    if (!this.isEnabled()) {
      console.error('❌ Xilnex integration is not enabled or configured');
      throw new Error('Xilnex integration is not enabled or configured');
    }

    try {
      console.log('🔄 Transforming contact to Xilnex client format...');
      const clientData = await this.transformContactToXilnexClient(contact);
      console.log('📤 Sending to Xilnex API:', JSON.stringify(clientData, null, 2));
      console.log('🌐 Request URL:', `${this.axiosInstance.defaults.baseURL}/logic/v2/clients`);
      console.log('🔑 Request headers:', this.axiosInstance.defaults.headers);
      
      const response = await this.axiosInstance.post('/logic/v2/clients', clientData);
      
      console.log('✅ XILNEX API RESPONSE STATUS:', response.status);
      console.log('📥 XILNEX API RESPONSE DATA:', JSON.stringify(response.data, null, 2));

      return {
        success: true,
        xilnexClientId: response.data.id || response.data.client?.id,
        data: response.data
      };

    } catch (error) {
      console.error('❌ XILNEX CREATE CLIENT ERROR:');
      console.error('   Error message:', error.message);
      console.error('   HTTP Status:', error.response?.status);
      console.error('   Response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('   Request config:', JSON.stringify({
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      }, null, 2));
      
      // Extract specific error message from Xilnex response
      let specificError = error.message;
      
      if (error.response?.data) {
        if (error.response.data.status) {
          specificError = error.response.data.status;
        } else if (error.response.data.warning) {
          specificError = error.response.data.warning;
        } else if (error.response.data.message) {
          specificError = error.response.data.message;
        }
      }
      
      console.log('📝 Extracted specific error:', specificError);
      
      return {
        success: false,
        error: specificError,
        statusCode: error.response?.status,
        details: error.response?.data
      };
    }
  }

  /**
   * Update an existing client in Xilnex
   */
  async updateClient(xilnexClientId, contact) {
    if (!this.isEnabled()) {
      throw new Error('Xilnex integration is not enabled or configured');
    }

    try {
      const clientData = await this.transformContactToXilnexClient(contact);
      
      const response = await this.axiosInstance.put(`/clients/${xilnexClientId}`, clientData);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      // Extract specific error message from Xilnex response
      let specificError = error.message;
      
      if (error.response?.data) {
        if (error.response.data.status) {
          specificError = error.response.data.status;
        } else if (error.response.data.warning) {
          specificError = error.response.data.warning;
        } else if (error.response.data.message) {
          specificError = error.response.data.message;
        }
      }
      
      return {
        success: false,
        error: specificError,
        statusCode: error.response?.status,
        details: error.response?.data
      };
    }
  }

  /**
   * Get client from Xilnex by ID
   */
  async getClient(xilnexClientId) {
    if (!this.isEnabled()) {
      throw new Error('Xilnex integration is not enabled or configured');
    }

    try {
      const response = await this.axiosInstance.get(`/clients/${xilnexClientId}`);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Delete client from Xilnex
   */
  async deleteClient(xilnexClientId) {
    if (!this.isEnabled()) {
      throw new Error('Xilnex integration is not enabled or configured');
    }

    try {
      const response = await this.axiosInstance.delete(`/clients/${xilnexClientId}`);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Sync contact with Xilnex (create or update)
   */
  async syncContact(contact) {
    console.log('🔄 XILNEX SYNC CONTACT START');
    console.log('  Contact ID:', contact._id);
    console.log('  Contact Name:', contact.firstName, contact.lastName);
    console.log('  Contact Email:', contact.email);
    console.log('  Existing Xilnex ID:', contact.xilnexClientId);
    
    if (!this.isEnabled()) {
      console.log('⚠️  Xilnex integration is DISABLED');
      console.log('  Enabled flag:', this.enabled);
      console.log('  App ID exists:', !!this.appId);
      console.log('  Token exists:', !!this.token);
      console.log('  Auth exists:', !!this.auth);
      return { success: true, skipped: true, reason: 'Integration disabled' };
    }

    console.log('✅ Xilnex integration is ENABLED, proceeding with sync...');

    try {
      let result;

      if (contact.xilnexClientId) {
        console.log('📝 Updating existing Xilnex client:', contact.xilnexClientId);
        // Update existing client
        result = await this.updateClient(contact.xilnexClientId, contact);
      } else {
        console.log('🆕 Creating new Xilnex client');
        // Create new client
        result = await this.createClient(contact);
      }

      console.log('🔄 XILNEX SYNC RESULT:', JSON.stringify(result, null, 2));
      return result;

    } catch (error) {
      console.error('❌ XILNEX SYNC ERROR:', error);
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch sync multiple contacts
   */
  async batchSyncContacts(contacts, batchSize = 5) {
    if (!this.isEnabled()) {
      return [];
    }

    const results = [];
    
    // Process contacts in batches to avoid overwhelming the API
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (contact) => {
        try {
          const result = await this.syncContact(contact);
          return { contact: contact._id, result };
        } catch (error) {
          return { 
            contact: contact._id, 
            result: { success: false, error: error.message } 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + batchSize < contacts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

module.exports = new XilnexService();