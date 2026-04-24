package com.flowershop.dto;

import jakarta.validation.constraints.*;

public class RegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Valid email required")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter valid 10-digit mobile number")
    private String phone;

    private String address;

    public String getName()                { return name; }
    public void   setName(String name)     { this.name = name; }
    public String getEmail()               { return email; }
    public void   setEmail(String email)   { this.email = email; }
    public String getPassword()            { return password; }
    public void   setPassword(String p)    { this.password = p; }
    public String getPhone()               { return phone; }
    public void   setPhone(String phone)   { this.phone = phone; }
    public String getAddress()             { return address; }
    public void   setAddress(String a)     { this.address = a; }
}
