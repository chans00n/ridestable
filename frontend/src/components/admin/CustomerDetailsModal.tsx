import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, DollarSign, Car, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { adminApi } from '@/services/adminApi';
import { showToast } from '@/components/ui/Toast';

interface CustomerDetailsModalProps {
  customerId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function CustomerDetailsModal({ customerId, onClose, onUpdate }: CustomerDetailsModalProps) {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [communications, setCommunications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'bookings' | 'communications' | 'send'>('details');
  const [messageForm, setMessageForm] = useState({
    channel: 'email' as 'email' | 'sms' | 'both',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      const response = await adminApi.get(`/admin/customers/${customerId}`);
      setCustomer(response.data.data);
      
      // Fetch bookings
      const bookingsResponse = await adminApi.get(`/admin/customers/${customerId}/bookings`);
      setBookings(bookingsResponse.data.data);
      
      // Fetch communications
      const commsResponse = await adminApi.get(`/admin/customers/${customerId}/communications`);
      setCommunications(commsResponse.data.data);
    } catch (error) {
      showToast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageForm.message.trim()) {
      showToast.error('Please enter a message');
      return;
    }

    if (messageForm.channel !== 'sms' && !messageForm.subject.trim()) {
      showToast.error('Please enter a subject for email');
      return;
    }

    setSending(true);
    try {
      await adminApi.post('/admin/customers/communicate', {
        customerId,
        ...messageForm
      });
      
      showToast.success('Message sent successfully');
      setMessageForm({ channel: 'email', subject: '', message: '' });
      fetchCustomerDetails(); // Refresh communications
      setActiveTab('communications');
    } catch (error) {
      showToast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-card dark:bg-zinc-900 rounded-lg p-6 border border-border">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card dark:bg-zinc-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-border">
        <div className="sticky top-0 bg-card dark:bg-zinc-900 border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Customer Details - {customer.firstName} {customer.lastName}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'details', label: 'Details', icon: User },
              { id: 'bookings', label: 'Bookings', icon: Car },
              { id: 'communications', label: 'Communications', icon: MessageSquare },
              { id: 'send', label: 'Send Message', icon: Send }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 flex items-center space-x-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          {activeTab === 'details' && (
            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div className="bg-muted/50 dark:bg-zinc-800/50 rounded-lg p-4 border border-border">
                <h3 className="font-medium mb-3 flex items-center text-foreground">
                  <User className="h-5 w-5 mr-2 text-muted-foreground" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium text-foreground">
                      {customer.firstName} {customer.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="ml-2 font-medium text-foreground">{customer.email}</span>
                    {customer.emailVerified && (
                      <Badge className="ml-2 bg-green-500/10 text-green-600 dark:text-green-400">Verified</Badge>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="ml-2 font-medium text-foreground">{customer.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Member Since:</span>
                    <span className="ml-2 font-medium text-foreground">
                      {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-muted/50 dark:bg-zinc-800/50 rounded-lg p-4 border border-border">
                <h3 className="font-medium mb-3 text-foreground">Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-foreground">{customer.totalBookings}</p>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-foreground">
                      {formatCurrency(customer.totalRevenue)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-foreground">
                      {formatCurrency(customer.averageBookingValue)}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Booking Value</p>
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              {customer.notificationPreferences && (
                <div className="bg-muted/50 dark:bg-zinc-800/50 rounded-lg p-4 border border-border">
                  <h3 className="font-medium mb-3 text-foreground">Notification Preferences</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Email Notifications</span>
                      <Badge className={customer.notificationPreferences.emailEnabled 
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                        : 'bg-muted text-muted-foreground'}>
                        {customer.notificationPreferences.emailEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">SMS Notifications</span>
                      <Badge className={customer.notificationPreferences.smsEnabled 
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                        : 'bg-muted text-muted-foreground'}>
                        {customer.notificationPreferences.smsEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="p-6">
              <h3 className="font-medium mb-4 text-foreground">Booking History</h3>
              {bookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No bookings found</p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-muted/50 dark:bg-zinc-800/50 rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Badge className={
                            booking.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                            booking.status === 'CANCELLED' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                            'bg-muted text-muted-foreground'
                          }>
                            {booking.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(booking.scheduledDateTime), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">{formatCurrency(booking.totalAmount)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{booking.pickupAddress} → {booking.dropoffAddress}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="p-6">
              <h3 className="font-medium mb-4 text-foreground">Communication History</h3>
              {communications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No communications found</p>
              ) : (
                <div className="space-y-4">
                  {communications.map((comm) => (
                    <div key={comm.id} className="bg-muted/50 dark:bg-zinc-800/50 rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Badge>{comm.channel.toUpperCase()}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(comm.createdAt), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <Badge className={
                          comm.status === 'sent' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                          comm.status === 'failed' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                          'bg-muted text-muted-foreground'
                        }>
                          {comm.status}
                        </Badge>
                      </div>
                      {comm.subject && (
                        <p className="font-medium text-foreground mb-1">{comm.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{comm.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'send' && (
            <div className="p-6">
              <h3 className="font-medium mb-4 text-foreground">Send Message to Customer</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Channel</label>
                  <select
                    value={messageForm.channel}
                    onChange={(e) => setMessageForm({ ...messageForm, channel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                
                {messageForm.channel !== 'sms' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Subject</label>
                    <Input
                      value={messageForm.subject}
                      onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                      placeholder="Enter subject..."
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Message</label>
                  <Textarea
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                    placeholder="Enter your message..."
                    rows={6}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending}
                  >
                    {sending ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}