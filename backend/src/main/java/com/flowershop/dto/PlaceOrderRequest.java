package com.flowershop.dto;

import java.util.List;

public class PlaceOrderRequest {

    private String address;
    private String customerName;
    private String customerPhone;
    private double customerLat;
    private double customerLon;
    private String paymentMethod; // COD or ONLINE
    private List<CartItemDto> items;

    public static class CartItemDto {
        private Long productId;
        private int  quantity;

        public Long getProductId()          { return productId; }
        public void setProductId(Long id)   { this.productId = id; }
        public int  getQuantity()           { return quantity; }
        public void setQuantity(int q)      { this.quantity = q; }
    }

    public String  getAddress()                    { return address; }
    public void    setAddress(String a)            { this.address = a; }
    public String  getCustomerName()               { return customerName; }
    public void    setCustomerName(String n)       { this.customerName = n; }
    public String  getCustomerPhone()              { return customerPhone; }
    public void    setCustomerPhone(String p)      { this.customerPhone = p; }
    public double  getCustomerLat()                { return customerLat; }
    public void    setCustomerLat(double v)        { this.customerLat = v; }
    public double  getCustomerLon()                { return customerLon; }
    public void    setCustomerLon(double v)        { this.customerLon = v; }
    public String  getPaymentMethod()              { return paymentMethod; }
    public void    setPaymentMethod(String m)      { this.paymentMethod = m; }
    public List<CartItemDto> getItems()            { return items; }
    public void    setItems(List<CartItemDto> i)   { this.items = i; }
}
