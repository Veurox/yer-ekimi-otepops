using HotelManagement.Core.Entities;
using HotelManagement.Core.Enums;
using HotelManagement.Infrastructure.Data;

namespace HotelManagement.API;

public static class DataSeeder
{
    public static async Task SeedRooms(ApplicationDbContext context)
    {
        // Check if rooms already exist
        if (context.Rooms.Any())
        {
            return; // Database has been seeded
        }

        var rooms = new List<Room>
        {
            new Room
            {
                Id = Guid.NewGuid(),
                Number = "101",
                Type = RoomType.Single,
                Price = 500,
                Status = RoomStatus.Available,
                Floor = 1,
                Capacity = 1,
                Features = new List<string> { "Tek Kişilik", "Klima", "WiFi", "Minibar" }
            },
            new Room
            {
                Id = Guid.NewGuid(),                Number = "102",
                Type = RoomType.Double,
                Price = 800,
                Status = RoomStatus.Available,
                Floor = 1,
                Capacity = 2,
                Features = new List<string> { "Çift Kişilik", "Klima", "WiFi", "Minibar", "Balkon" }
            },
            new Room
            {
                Id = Guid.NewGuid(),                Number = "103",
                Type = RoomType.Suite,
                Price = 1500,
                Status = RoomStatus.Available,
                Floor = 1,
                Capacity = 4,
                Features = new List<string> { "Suit", "Jakuzi", "Klima", "WiFi", "Minibar", "Deniz Manzarası" }
            },
            new Room
            {
                Id = Guid.NewGuid(),                Number = "201",
                Type = RoomType.Single,
                Price = 550,
                Status = RoomStatus.Available,
                Floor = 2,
                Capacity = 1,
                Features = new List<string> { "Tek Kişilik", "Klima", "WiFi", "Minibar", "Şehir Manzarası" }
            },
            new Room
            {
                Id = Guid.NewGuid(),                Number = "202",
                Type = RoomType.Double,
                Price = 850,
                Status = RoomStatus.Available,
                Floor = 2,
                Capacity = 2,
                Features = new List<string> { "Çift Kişilik", "Klima", "WiFi", "Minibar", "Balkon", "Deniz Manzarası" }
            },
            new Room
            {
                Id = Guid.NewGuid(),                Number = "203",
                Type = RoomType.Deluxe,
                Price = 1200,
                Status = RoomStatus.Available,
                Floor = 2,
                Capacity = 3,
                Features = new List<string> { "Deluxe", "King Size Yatak", "Klima", "WiFi", "Minibar", "Oturma Alanı" }
            },
            new Room
            {
                Id = Guid.NewGuid(),                Number = "301",
                Type = RoomType.Suite,
                Price = 1800,
                Status = RoomStatus.Available,
                Floor = 3,
                Capacity = 4,
                Features = new List<string> { "Suit", "Jakuzi", "Klima", "WiFi", "Minibar", "Panoramik Deniz Manzarası", "Oturma Odası" }
            },
            new Room
            {
                Id = Guid.NewGuid(),                Number = "302",
                Type = RoomType.Double,
                Price = 900,
                Status = RoomStatus.Available,
                Floor = 3,
                Capacity = 2,
                Features = new List<string> { "Çift Kişilik", "Klima", "WiFi", "Minibar", "Balkon", "Deniz Manzarası" }
            },
            new Room
            {
                Id = Guid.NewGuid(),                Number = "303",
                Type = RoomType.Deluxe,
                Price = 1300,
                Status = RoomStatus.Available,
                Floor = 3,
                Capacity = 3,
                Features = new List<string> { "Deluxe", "King Size Yatak", "Klima", "WiFi", "Minibar", "Oturma Alanı", "Şehir Manzarası" }
            },
            new Room
            {
                Id = Guid.NewGuid(),                Number = "401",
                Type = RoomType.Suite,
                Price = 2000,
                Status = RoomStatus.Available,
                Floor = 4,
                Capacity = 4,
                Features = new List<string> { "Presidential Suite", "Jakuzi", "Sauna", "Klima", "WiFi", "Minibar", "Panoramik Manzara", "2 Yatak Odası" }
            }
        };

        context.Rooms.AddRange(rooms);
        await context.SaveChangesAsync();
    }

    public static async Task SeedStaff(ApplicationDbContext context)
    {
        // Check if staff already exist
        if (!context.Staff.Any(s => s.UserName == "admin"))
        {
            var adminUser = new Staff
            {
                Id = Guid.NewGuid(),
                UserName = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                FirstName = "Ahmet",
                LastName = "Yılmaz",
                Email = "admin@otelops.com",
                PhoneNumber = "+90 555 111 2233",
                Role = StaffRole.Manager,
                Shift = ShiftType.Morning,
                Salary = 15000,
                IsActive = true
            };
            context.Staff.Add(adminUser);
            await context.SaveChangesAsync();
        }

        // Ensure receptionist user exists and has correct password
        var receptionUser = context.Staff.FirstOrDefault(s => s.UserName == "resepsiyon1");
        if (receptionUser == null)
        {
            receptionUser = new Staff
            {
                Id = Guid.NewGuid(),
                UserName = "resepsiyon1",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("resepsiyon123"),
                FirstName = "Ayşe",
                LastName = "Demir",
                Email = "ayse@otelops.com",
                PhoneNumber = "+90 555 222 3344",
                Role = StaffRole.Receptionist,
                Shift = ShiftType.Morning,
                Salary = 8000,
                IsActive = true
            };
            context.Staff.Add(receptionUser);
        }
        else
        {
            // Force update password to ensure login works
            receptionUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("resepsiyon123");
            receptionUser.IsActive = true;
            context.Staff.Update(receptionUser);
        }
        await context.SaveChangesAsync();

        // Ensure housekeeping user exists
        if (!context.Staff.Any(s => s.UserName == "temizlik1"))
        {
            var hkUser = new Staff
            {
                Id = Guid.NewGuid(),
                UserName = "temizlik1",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("temizlik123"),
                FirstName = "Fatma",
                LastName = "Kaya",
                Email = "fatma@otelops.com",
                PhoneNumber = "+90 555 333 4455",
                Role = StaffRole.Housekeeping,
                Shift = ShiftType.Morning,
                Salary = 6500,
                IsActive = true
            };
            context.Staff.Add(hkUser);
            await context.SaveChangesAsync();
        }
        
        // Ensure technician user exists
        if (!context.Staff.Any(s => s.UserName == "tekniker"))
        {
            var techUser = new Staff
            {
                Id = Guid.NewGuid(),
                UserName = "tekniker",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("tekniker123"),
                FirstName = "Veli",
                LastName = "Teknik",
                Email = "teknik@otelops.com",
                PhoneNumber = "+90 555 987 6543",
                Role = StaffRole.Maintenance,
                Shift = ShiftType.Morning,
                Salary = 9000,
                IsActive = true
            };
            context.Staff.Add(techUser);
            await context.SaveChangesAsync();
        }

        // Ensure room service user exists
        if (!context.Staff.Any(s => s.UserName == "mutfak"))
        {
            var rsUser = new Staff
            {
                Id = Guid.NewGuid(),
                UserName = "mutfak",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("mutfak123"),
                FirstName = "Mehmet",
                LastName = "Usta",
                Email = "mutfak@otelops.com",
                PhoneNumber = "+90 555 777 8899",
                Role = StaffRole.RoomService,
                Shift = ShiftType.Morning,
                Salary = 8500,
                IsActive = true
            };
            context.Staff.Add(rsUser);
            await context.SaveChangesAsync();
        }

        // Ensure customer user exists (for demo purposes)
        if (!context.Staff.Any(s => s.UserName == "musteri1"))
        {
            var customerUser = new Staff
            {
                Id = Guid.NewGuid(),
                UserName = "musteri1",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("musteri123"),
                FirstName = "Can",
                LastName = "Misafir",
                Email = "can@example.com",
                PhoneNumber = "+90 555 000 0000",
                Role = StaffRole.Customer,
                Shift = ShiftType.Morning, // Irrelevant for customer
                Salary = 0, // Irrelevant for customer
                IsActive = true
            };
            context.Staff.Add(customerUser);
            await context.SaveChangesAsync();
        }
    }

    public static async Task SeedGuests(ApplicationDbContext context)
    {
        if (context.Guests.Any()) return;

        var guests = new List<Guest>
        {
            new Guest 
            { 
                Id = Guid.NewGuid(), 
                Name = "Ali Yılmaz", 
                IdNumber = "11111111111", 
                Email = "ali.yilmaz@example.com", 
                Phone = "5551112233", 
                Address = "İstanbul, Kadıköy", 
                IsPrimaryGuest = true,
                Visits = 1,
                TotalSpent = 1500,
                IsActive = true
            },
            new Guest 
            { 
                Id = Guid.NewGuid(), 
                Name = "Ayşe Kaya", 
                IdNumber = "22222222222", 
                Email = "ayse.kaya@example.com", 
                Phone = "5552223344", 
                Address = "Ankara, Çankaya", 
                IsPrimaryGuest = true, 
                Visits = 0,
                TotalSpent = 0,
                IsActive = true
            },
            new Guest 
            { 
                Id = Guid.NewGuid(), 
                Name = "Mehmet Demir", 
                IdNumber = "33333333333", 
                Email = "mehmet.demir@example.com", 
                Phone = "5553334455", 
                Address = "İzmir, Karşıyaka", 
                IsPrimaryGuest = true, 
                Visits = 2,
                TotalSpent = 3200,
                IsActive = true
            }
        };

        context.Guests.AddRange(guests);
        await context.SaveChangesAsync();
    }

    public static async Task SeedInventory(ApplicationDbContext context)
    {
        if (context.InventoryItems.Any()) return;

        var items = new List<InventoryItem>
        {
            new InventoryItem { Id = Guid.NewGuid(), Name = "El Havlusu", Category = InventoryCategory.Linens, Quantity = 200, Unit = "Adet", MinQuantity = 50, LastRestocked = DateTime.UtcNow.AddDays(-10) },
            new InventoryItem { Id = Guid.NewGuid(), Name = "Banyo Havlusu", Category = InventoryCategory.Linens, Quantity = 150, Unit = "Adet", MinQuantity = 40, LastRestocked = DateTime.UtcNow.AddDays(-10) },
            new InventoryItem { Id = Guid.NewGuid(), Name = "Çarşaf (Tek Kişilik)", Category = InventoryCategory.Linens, Quantity = 100, Unit = "Adet", MinQuantity = 30, LastRestocked = DateTime.UtcNow.AddDays(-15) },
            new InventoryItem { Id = Guid.NewGuid(), Name = "Çarşaf (Çift Kişilik)", Category = InventoryCategory.Linens, Quantity = 100, Unit = "Adet", MinQuantity = 30, LastRestocked = DateTime.UtcNow.AddDays(-15) },
            new InventoryItem { Id = Guid.NewGuid(), Name = "Şampuan (50ml)", Category = InventoryCategory.Toiletries, Quantity = 500, Unit = "Adet", MinQuantity = 100, LastRestocked = DateTime.UtcNow.AddDays(-5) },
            new InventoryItem { Id = Guid.NewGuid(), Name = "Duş Jeli (50ml)", Category = InventoryCategory.Toiletries, Quantity = 500, Unit = "Adet", MinQuantity = 100, LastRestocked = DateTime.UtcNow.AddDays(-5) },
            new InventoryItem { Id = Guid.NewGuid(), Name = "Tuvalet Kağıdı", Category = InventoryCategory.Toiletries, Quantity = 1000, Unit = "Rulo", MinQuantity = 200, LastRestocked = DateTime.UtcNow.AddDays(-2) },
            new InventoryItem { Id = Guid.NewGuid(), Name = "Yüzey Temizleyici", Category = InventoryCategory.Cleaning, Quantity = 50, Unit = "Lt", MinQuantity = 10, LastRestocked = DateTime.UtcNow.AddDays(-20) }
        };

        context.InventoryItems.AddRange(items);
        await context.SaveChangesAsync();
    }

    public static async Task SeedMenu(ApplicationDbContext context)
    {
        if (context.MenuItems.Any()) return;

        var menuItems = new List<MenuItem>
        {
            new MenuItem { Id = Guid.NewGuid(), Name = "Serpme Kahvaltı", Description = "Klasik Türk kahvaltısı, sınırsız çay", Price = 350, Category = "Kahvaltı", Available = true },
            new MenuItem { Id = Guid.NewGuid(), Name = "Hamburger Menü", Description = "180gr dana burger, patates, içecek", Price = 280, Category = "Ana Yemek", Available = true },
            new MenuItem { Id = Guid.NewGuid(), Name = "Izgara Köfte", Description = "Pilav ve közlenmiş sebzeler ile", Price = 300, Category = "Ana Yemek", Available = true },
            new MenuItem { Id = Guid.NewGuid(), Name = "Sezar Salata", Description = "Izgara tavuklu klasik sezar salata", Price = 220, Category = "Salata", Available = true },
            new MenuItem { Id = Guid.NewGuid(), Name = "Mercimek Çorbası", Description = "Kıtır ekmek ile", Price = 90, Category = "Çorba", Available = true },
            new MenuItem { Id = Guid.NewGuid(), Name = "Coca Cola", Description = "330ml kutu", Price = 60, Category = "İçecek", Available = true },
            new MenuItem { Id = Guid.NewGuid(), Name = "Su", Description = "500ml cam şişe", Price = 30, Category = "İçecek", Available = true },
            new MenuItem { Id = Guid.NewGuid(), Name = "Türk Kahvesi", Description = "Lokum ile", Price = 70, Category = "Sıcak İçecek", Available = true }
        };

        context.MenuItems.AddRange(menuItems);
        await context.SaveChangesAsync();
    }

    public static async Task SeedReservations(ApplicationDbContext context)
    {
        if (context.Reservations.Any()) return;

        var guest1 = context.Guests.FirstOrDefault(g => g.IdNumber == "11111111111");
        var guest2 = context.Guests.FirstOrDefault(g => g.IdNumber == "22222222222");
        var guest3 = context.Guests.FirstOrDefault(g => g.IdNumber == "33333333333");

        var room101 = context.Rooms.FirstOrDefault(r => r.Number == "101");
        var room202 = context.Rooms.FirstOrDefault(r => r.Number == "202");
        var room303 = context.Rooms.FirstOrDefault(r => r.Number == "303");

        if (guest1 == null || room101 == null) return;

        var reservations = new List<Reservation>
        {
            // Past
            new Reservation
            {
                Id = Guid.NewGuid(),
                GuestId = guest1.Id,
                RoomId = room101.Id,
                CheckInDate = DateTime.UtcNow.AddDays(-5),
                CheckOutDate = DateTime.UtcNow.AddDays(-2),
                ActualCheckOutDate = DateTime.UtcNow.AddDays(-2),
                NumberOfGuests = 1,
                TotalAmount = 1500,
                TotalPrice = 1500,
                PaidAmount = 1500,
                IsPaid = true,
                PaymentMethod = "Credit Card",
                Status = ReservationStatus.CheckedOut,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            // Active
             new Reservation
            {
                Id = Guid.NewGuid(),
                GuestId = guest3?.Id ?? Guid.NewGuid(),
                RoomId = room202?.Id ?? Guid.NewGuid(),
                CheckInDate = DateTime.UtcNow.Date,
                CheckOutDate = DateTime.UtcNow.Date.AddDays(3),
                NumberOfGuests = 2,
                TotalAmount = 2550,
                TotalPrice = 2550,
                PaidAmount = 1000,
                IsPaid = false,
                PaymentMethod = "Cash",
                Status = ReservationStatus.CheckedIn,
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            // Future
            new Reservation
            {
                Id = Guid.NewGuid(),
                GuestId = guest2?.Id ?? Guid.NewGuid(),
                RoomId = room303?.Id ?? Guid.NewGuid(),
                CheckInDate = DateTime.UtcNow.AddDays(10),
                CheckOutDate = DateTime.UtcNow.AddDays(12),
                NumberOfGuests = 2,
                TotalAmount = 2600,
                TotalPrice = 2600,
                PaidAmount = 0,
                IsPaid = false,
                Status = ReservationStatus.Confirmed,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            }
        };

        context.Reservations.AddRange(reservations);
        
        if (room202 != null) 
        {
            room202.Status = RoomStatus.Occupied;
            context.Rooms.Update(room202);
        }

        await context.SaveChangesAsync();
    }

    public static async Task SeedMaintenance(ApplicationDbContext context)
    {
        if (context.MaintenanceRequests.Any()) return;

        var room101 = context.Rooms.FirstOrDefault(r => r.Number == "101");
        if (room101 == null) return;

        var requests = new List<MaintenanceRequest>
        {
            new MaintenanceRequest { 
                Id = Guid.NewGuid(), 
                RoomId = room101.Id, 
                Title = "Klima Arızası",
                Description = "Klima soğutmuyor.", 
                Priority = MaintenancePriority.High, 
                Status = MaintenanceStatus.Pending, 
                CreatedAt = DateTime.UtcNow.AddHours(-4) 
            },
            new MaintenanceRequest { 
                Id = Guid.NewGuid(), 
                RoomId = room101.Id, 
                Title = "Lamba Değişimi",
                Description = "Lamba bozuk.", 
                Priority = MaintenancePriority.Low, 
                Status = MaintenanceStatus.Completed, 
                CreatedAt = DateTime.UtcNow.AddDays(-2), 
                CompletedAt = DateTime.UtcNow.AddDays(-1) 
            }
        };

        context.MaintenanceRequests.AddRange(requests);
        await context.SaveChangesAsync();
    }

     public static async Task SeedOrders(ApplicationDbContext context)
    {
        if (context.RoomServiceOrders.Any()) return;
        
        var room = context.Rooms.FirstOrDefault(r => r.Number == "202");
        var burger = context.MenuItems.FirstOrDefault(m => m.Name.Contains("Hamburger"));
        var cola = context.MenuItems.FirstOrDefault(m => m.Name.Contains("Cola"));

        if (room == null || burger == null) return;

        var order = new RoomServiceOrder
        {
            Id = Guid.NewGuid(),
            RoomId = room.Id,
            Status = OrderStatus.Pending,
            OrderedAt = DateTime.UtcNow.AddMinutes(-30),
            TotalPrice = burger.Price + (cola?.Price ?? 0)
        };
        
        order.Items = new List<RoomServiceOrderItem>
        {
            new RoomServiceOrderItem { Id = Guid.NewGuid(), MenuItemId = burger.Id, Quantity = 1, SpecialInstructions = "Turşu olmasın" }
        };
        
        if (cola != null) 
             order.Items.Add(new RoomServiceOrderItem { Id = Guid.NewGuid(), MenuItemId = cola.Id, Quantity = 1 });

        context.RoomServiceOrders.Add(order);
        await context.SaveChangesAsync();
    }
}
