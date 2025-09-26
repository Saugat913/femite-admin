'use client'

import { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon, 
  Store,
  Truck,
  CreditCard,
  Users,
  Mail,
  Shield,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { settingsApi } from '@/lib/api'
import type { StoreSettings, ShippingSettings, PaymentSettings } from '@/types'

interface SettingsState {
  storeSettings: StoreSettings | null
  shippingSettings: ShippingSettings | null
  paymentSettings: PaymentSettings | null
  loading: boolean
  error: string | null
  saving: boolean
  activeTab: string
}

function StoreSettingsTab({ settings, onUpdate, loading }: {
  settings: StoreSettings | null
  onUpdate: (settings: StoreSettings) => void
  loading: boolean
}) {
  const [form, setForm] = useState<StoreSettings>({
    store_name: '',
    store_email: '',
    store_phone: '',
    store_address: '',
    currency: 'USD',
    tax_rate: 0,
    shipping_enabled: true,
    default_shipping_cost: 0
  })

  useEffect(() => {
    if (settings) {
      setForm(settings)
    }
  }, [settings])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
          <Store className="w-5 h-5 mr-2" />
          Store Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Store Name</label>
            <input
              type="text"
              value={form.store_name}
              onChange={(e) => setForm(prev => ({ ...prev, store_name: e.target.value }))}
              className="form-input"
              placeholder="Femite Hemp Fashion"
              required
            />
          </div>
          
          <div>
            <label className="form-label">Store Email</label>
            <input
              type="email"
              value={form.store_email}
              onChange={(e) => setForm(prev => ({ ...prev, store_email: e.target.value }))}
              className="form-input"
              placeholder="info@femitehempfashion.com"
              required
            />
          </div>
          
          <div>
            <label className="form-label">Store Phone</label>
            <input
              type="tel"
              value={form.store_phone || ''}
              onChange={(e) => setForm(prev => ({ ...prev, store_phone: e.target.value }))}
              className="form-input"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div>
            <label className="form-label">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
              className="form-input"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="form-label">Store Address</label>
          <textarea
            value={form.store_address || ''}
            onChange={(e) => setForm(prev => ({ ...prev, store_address: e.target.value }))}
            className="form-input"
            rows={3}
            placeholder="123 Hemp Street, Fashion District, City, State, ZIP"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Pricing & Tax</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.tax_rate}
              onChange={(e) => setForm(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
              className="form-input"
              placeholder="8.25"
            />
            <p className="text-xs text-gray-500 mt-1">Enter as percentage (e.g., 8.25 for 8.25%)</p>
          </div>
          
          <div>
            <label className="form-label">Default Shipping Cost</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.default_shipping_cost}
              onChange={(e) => setForm(prev => ({ ...prev, default_shipping_cost: parseFloat(e.target.value) || 0 }))}
              className="form-input"
              placeholder="9.99"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={form.shipping_enabled}
              onChange={(e) => setForm(prev => ({ ...prev, shipping_enabled: e.target.checked }))}
              className="rounded border-gray-300 text-black focus:ring-black mr-2"
            />
            <span className="text-sm text-gray-700">Enable shipping calculations</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="btn btn-primary btn-md"
        >
          {loading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Store Settings
            </>
          )}
        </button>
      </div>
    </form>
  )
}

function ShippingSettingsTab({ settings, onUpdate, loading }: {
  settings: ShippingSettings | null
  onUpdate: (settings: ShippingSettings) => void
  loading: boolean
}) {
  const [form, setForm] = useState<ShippingSettings>({
    enabled: true,
    free_shipping_threshold: 0,
    default_cost: 0,
    zones: []
  })

  useEffect(() => {
    if (settings) {
      setForm(settings)
    }
  }, [settings])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
          <Truck className="w-5 h-5 mr-2" />
          Shipping Configuration
        </h3>
        
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded border-gray-300 text-black focus:ring-black mr-2"
            />
            <span className="text-sm text-gray-700">Enable shipping</span>
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Default Shipping Cost</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.default_cost}
                onChange={(e) => setForm(prev => ({ ...prev, default_cost: parseFloat(e.target.value) || 0 }))}
                className="form-input"
                placeholder="9.99"
              />
            </div>
            
            <div>
              <label className="form-label">Free Shipping Threshold</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.free_shipping_threshold || 0}
                onChange={(e) => setForm(prev => ({ ...prev, free_shipping_threshold: parseFloat(e.target.value) || 0 }))}
                className="form-input"
                placeholder="50.00"
              />
              <p className="text-xs text-gray-500 mt-1">Set to 0 to disable free shipping</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Shipping Zones</h3>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              Shipping zones allow you to set different rates for different regions.
            </p>
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
            >
              Add Shipping Zone
            </button>
          </div>
          
          {form.zones.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No shipping zones configured. Using default shipping cost for all orders.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="btn btn-primary btn-md"
        >
          {loading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Shipping Settings
            </>
          )}
        </button>
      </div>
    </form>
  )
}

function PaymentSettingsTab({ settings, onUpdate, loading }: {
  settings: PaymentSettings | null
  onUpdate: (settings: PaymentSettings) => void
  loading: boolean
}) {
  const [form, setForm] = useState<PaymentSettings>({
    stripe_enabled: false,
    stripe_publishable_key: '',
    paypal_enabled: false,
    cash_on_delivery_enabled: false
  })

  useEffect(() => {
    if (settings) {
      setForm(settings)
    }
  }, [settings])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Payment Methods
        </h3>
        
        <div className="space-y-6">
          {/* Stripe */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-black">Stripe</h4>
                <p className="text-sm text-gray-500">Accept credit cards securely</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.stripe_enabled}
                  onChange={(e) => setForm(prev => ({ ...prev, stripe_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-black focus:ring-black mr-2"
                />
                <span className="text-sm">Enable</span>
              </label>
            </div>
            
            {form.stripe_enabled && (
              <div>
                <label className="form-label">Stripe Publishable Key</label>
                <input
                  type="text"
                  value={form.stripe_publishable_key || ''}
                  onChange={(e) => setForm(prev => ({ ...prev, stripe_publishable_key: e.target.value }))}
                  className="form-input"
                  placeholder="pk_live_..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is safe to share publicly. Secret key should be set in environment variables.
                </p>
              </div>
            )}
          </div>
          
          {/* PayPal */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-black">PayPal</h4>
                <p className="text-sm text-gray-500">Accept PayPal payments</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.paypal_enabled}
                  onChange={(e) => setForm(prev => ({ ...prev, paypal_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-black focus:ring-black mr-2"
                />
                <span className="text-sm">Enable</span>
              </label>
            </div>
          </div>
          
          {/* Cash on Delivery */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-black">Cash on Delivery</h4>
                <p className="text-sm text-gray-500">Pay when receiving the order</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.cash_on_delivery_enabled}
                  onChange={(e) => setForm(prev => ({ ...prev, cash_on_delivery_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-black focus:ring-black mr-2"
                />
                <span className="text-sm">Enable</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="btn btn-primary btn-md"
        >
          {loading ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Payment Settings
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default function SettingsPage() {
  const [state, setState] = useState<SettingsState>({
    storeSettings: null,
    shippingSettings: null,
    paymentSettings: null,
    loading: true,
    error: null,
    saving: false,
    activeTab: 'store'
  })

  const fetchSettings = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const [storeResponse, shippingResponse, paymentResponse] = await Promise.all([
        settingsApi.get(),
        settingsApi.getShipping(),
        settingsApi.getPayment()
      ])
      
      setState(prev => ({
        ...prev,
        storeSettings: storeResponse.success ? storeResponse.data as StoreSettings : null,
        shippingSettings: shippingResponse.success ? shippingResponse.data as ShippingSettings : null,
        paymentSettings: paymentResponse.success ? paymentResponse.data as PaymentSettings : null,
        loading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load settings',
        loading: false
      }))
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleUpdateStoreSettings = async (settings: StoreSettings) => {
    try {
      setState(prev => ({ ...prev, saving: true, error: null }))
      
      const response = await settingsApi.update(settings as unknown as Record<string, unknown>)
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          storeSettings: settings,
          saving: false 
        }))
      } else {
        setState(prev => ({ 
          ...prev, 
          error: response.error || 'Failed to save settings',
          saving: false 
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save settings',
        saving: false
      }))
    }
  }

  const handleUpdateShippingSettings = async (settings: ShippingSettings) => {
    try {
      setState(prev => ({ ...prev, saving: true, error: null }))
      
      const response = await settingsApi.updateShipping(settings as unknown as Record<string, unknown>)
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          shippingSettings: settings,
          saving: false 
        }))
      } else {
        setState(prev => ({ 
          ...prev, 
          error: response.error || 'Failed to save shipping settings',
          saving: false 
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save shipping settings',
        saving: false
      }))
    }
  }

  const handleUpdatePaymentSettings = async (settings: PaymentSettings) => {
    try {
      setState(prev => ({ ...prev, saving: true, error: null }))
      
      const response = await settingsApi.updatePayment(settings as unknown as Record<string, unknown>)
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          paymentSettings: settings,
          saving: false 
        }))
      } else {
        setState(prev => ({ 
          ...prev, 
          error: response.error || 'Failed to save payment settings',
          saving: false 
        }))
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save payment settings',
        saving: false
      }))
    }
  }

  if (state.loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-20"></div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'store', name: 'Store Settings', icon: Store },
    { id: 'shipping', name: 'Shipping', icon: Truck },
    { id: 'payment', name: 'Payment', icon: CreditCard }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your store settings and preferences</p>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{state.error}</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!state.saving && !state.error && !state.loading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800">Settings loaded successfully</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setState(prev => ({ ...prev, activeTab: tab.id }))}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  state.activeTab === tab.id
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {state.activeTab === 'store' && (
        <StoreSettingsTab
          settings={state.storeSettings}
          onUpdate={handleUpdateStoreSettings}
          loading={state.saving}
        />
      )}

      {state.activeTab === 'shipping' && (
        <ShippingSettingsTab
          settings={state.shippingSettings}
          onUpdate={handleUpdateShippingSettings}
          loading={state.saving}
        />
      )}

      {state.activeTab === 'payment' && (
        <PaymentSettingsTab
          settings={state.paymentSettings}
          onUpdate={handleUpdatePaymentSettings}
          loading={state.saving}
        />
      )}
    </div>
  )
}