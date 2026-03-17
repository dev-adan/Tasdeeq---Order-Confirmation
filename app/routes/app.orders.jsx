import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  // Get shop
  const shop = await db.shop.findUnique({
    where: { shopDomain: session.shop }
  });

  if (!shop) {
    return { orders: [], stats: null };
  }

  // Get orders with pagination
  const orders = await db.order.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: 'desc' },
    take: 50 // Show last 50 orders
  });

  // Calculate stats
  const stats = {
    total: await db.order.count({ where: { shopId: shop.id } }),
    pending: await db.order.count({ where: { shopId: shop.id, status: 'pending' } }),
    confirmed: await db.order.count({ where: { shopId: shop.id, status: 'confirmed' } }),
    cancelled: await db.order.count({ where: { shopId: shop.id, status: 'cancelled' } }),
    shipped: await db.order.count({ where: { shopId: shop.id, status: 'shipped' } })
  };

  return { orders, stats };
};

export default function Orders() {
  const { orders, stats } = useLoaderData();

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffa500';
      case 'confirmed': return '#008060';
      case 'cancelled': return '#d72c0d';
      case 'shipped': return '#5c6ac4';
      default: return '#666';
    }
  };

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: `${color}20`,
        color: color,
        textTransform: 'uppercase'
      }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Orders</h1>
        <p style={{ fontSize: "16px", color: "#666" }}>
          Track WhatsApp confirmations and order status
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "30px"
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #ddd"
          }}>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Total Orders</p>
            <p style={{ fontSize: "32px", fontWeight: "bold" }}>{stats.total}</p>
          </div>

          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #ddd"
          }}>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Pending</p>
            <p style={{ fontSize: "32px", fontWeight: "bold", color: "#ffa500" }}>{stats.pending}</p>
          </div>

          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #ddd"
          }}>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Confirmed</p>
            <p style={{ fontSize: "32px", fontWeight: "bold", color: "#008060" }}>{stats.confirmed}</p>
          </div>

          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #ddd"
          }}>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Cancelled</p>
            <p style={{ fontSize: "32px", fontWeight: "bold", color: "#d72c0d" }}>{stats.cancelled}</p>
          </div>

          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #ddd"
          }}>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Shipped</p>
            <p style={{ fontSize: "32px", fontWeight: "bold", color: "#5c6ac4" }}>{stats.shipped}</p>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #ddd",
        overflow: "hidden"
      }}>
        {orders.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "18px", color: "#666", marginBottom: "10px" }}>
              No orders yet
            </p>
            <p style={{ fontSize: "14px", color: "#999" }}>
              Orders will appear here when customers place orders on your store
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f6f6f7", borderBottom: "1px solid #ddd" }}>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#666" }}>
                    ORDER #
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#666" }}>
                    CUSTOMER
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#666" }}>
                    PHONE
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#666" }}>
                    TOTAL
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#666" }}>
                    PAYMENT
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#666" }}>
                    STATUS
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#666" }}>
                    WHATSAPP
                  </th>
                  <th style={{ padding: "12px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#666" }}>
                    DATE
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px", fontSize: "14px" }}>
                      #{order.shopifyOrderNumber}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px" }}>
                      {order.customerName}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#666" }}>
                      {order.customerPhone}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px", fontWeight: "600" }}>
                      ${order.orderTotal}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px" }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        backgroundColor: order.paymentMethod === 'COD' ? '#fff4e6' : '#e6f4ff',
                        color: order.paymentMethod === 'COD' ? '#cc7a00' : '#0066cc'
                      }}>
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      {getStatusBadge(order.status)}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px" }}>
                      {order.whatsappMessageSent ? (
                        <span style={{ color: "#008060" }}>✓ Sent</span>
                      ) : (
                        <span style={{ color: "#999" }}>Not sent</span>
                      )}
                    </td>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#666" }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
