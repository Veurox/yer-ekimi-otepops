# Hotel Management System - Backend API

## 🏨 Project Overview
This project is the backend service for the Hotel Management Application. It provides a robust RESTful API built with **.NET 8/9** to handle all core business logic, including reservations, guest management, room operations, and staff coordination. The application is designed using **Clean Architecture** principles to ensuring scalability and maintainability.

## 🛠️ Technology Stack
- **Framework:** .NET 8 / .NET 9
- **Database:** PostgreSQL (Relation Database)
- **ORM:** Entity Framework Core 9.0
- **Containerization:** Docker & Docker Compose
- **API Documentation:** Swagger UI (OpenAPI)
- **Authentication:** JWT (JSON Web Tokens)

## 📂 Solution Structure
The solution is organized into four main layers:

1.  **HotelManagement.Core** 🧠
    - Contains the domain entities (Room, Guest, Reservation, etc.).
    - Defines repository interfaces and core contracts.
    - No external dependencies (Pure C#).

2.  **HotelManagement.Infrastructure** 🏗️
    - Implements data access using Entity Framework Core.
    - Handles database migrations and repository implementations.
    - Connects effectively to PostgreSQL.

3.  **HotelManagement.Business** 💼
    - Contains application business logic and services.
    - Uses AutoMapper (or manual mapping) for DTOs.
    - Implements validation logic (e.g., Reservation rules).

4.  **HotelManagement.API** 🚀
    - The entry point of the application.
    - Defines Controllers and API Endpoints.
    - Configures Dependency Injection and Middleware.

## 🚀 Getting Started

### Prerequisites
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download) (or newer)
- [PostgreSQL](https://www.postgresql.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Optional, for containerized run)

### Option 1: Run with Docker 🐳 (Recommended)
This method runs the Backend, Database, and Frontend together.

1.  Navigate to the root directory of the repository.
2.  Run the compose command:
    ```bash
    docker compose up --build
    ```
3.  The API will be available at: `http://localhost:5098`
4.  **Swagger UI:** `http://localhost:5098/swagger`

### Option 2: Run Locally 💻

1.  **Configure Database:**
    Update `HotelManagement.API/appsettings.json` with your PostgreSQL connection string:
    ```json
    "ConnectionStrings": {
      "DefaultConnection": "Host=localhost;Database=HotelManagementDb_Final;Username=postgres;Password=YOUR_PASSWORD"
    }
    ```

2.  **Apply Migrations:**
    Open a terminal in the root folder and run:
    ```bash
    dotnet ef database update --project HotelManagement.Infrastructure --startup-project HotelManagement.API
    ```

3.  **Run the API:**
    ```bash
    cd HotelManagement.API
    dotnet run
    ```
    *Local URL:* `http://localhost:5097` (or similar, check terminal output).

## 🔑 Key Features
*   **Reservation System:** Full cycle (Pending -> Confirmed -> Checked-In -> Checked-Out).
*   **Smart Search:** Filter guests by active reservations status.
*   **Room Management:** Track availability, cleaning status, and maintenance.
*   **Staff Shifts:** Manage employee roles and assignments.
*   **Inventory & Room Service:** Track stock levels and guest orders.

## 📝 API Endpoints (Swagger)
The API comes with built-in Swagger documentation. Once running, visit:
- **Local:** `http://localhost:5097/swagger`
- **Docker:** `http://localhost:5098/swagger`

This interface allows you to test all endpoints (GET, POST, PUT, DELETE) directly from your browser.
