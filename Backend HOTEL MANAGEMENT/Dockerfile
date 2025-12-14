# Use Microsoft's official .NET image.
# https://hub.docker.com/_/microsoft-dotnet-sdk/
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["HotelManagement.API/HotelManagement.API.csproj", "HotelManagement.API/"]
COPY ["HotelManagement.Business/HotelManagement.Business.csproj", "HotelManagement.Business/"]
COPY ["HotelManagement.Core/HotelManagement.Core.csproj", "HotelManagement.Core/"]
COPY ["HotelManagement.Infrastructure/HotelManagement.Infrastructure.csproj", "HotelManagement.Infrastructure/"]

RUN dotnet restore "HotelManagement.API/HotelManagement.API.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/HotelManagement.API"
RUN dotnet build "HotelManagement.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "HotelManagement.API.csproj" -c Release -o /app/publish

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "HotelManagement.API.dll"]
