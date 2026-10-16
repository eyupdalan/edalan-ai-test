// Sahte kullanıcı deposu. Gerçek kimlik doğrulama gelene kadar kullanılır.
// Şifreler içerdiği için yalnızca sunucu tarafında (session, actions, proxy) import edin.
// Güncellemeler bellekte tutulur; sunucu yeniden başlayınca ilk hâline döner.

export type Role = "Yönetici" | "Analist" | "Müşteri Temsilcisi";

export type Address = { city: string; district: string; line: string };

export type ContactPermissions = { sms: boolean; email: boolean; phone: boolean };

export type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  department: string;
  phone: string;
  customerNo: string;
  joinedAt: string;
  address: Address;
  education: string;
  occupation: string;
  employer: string;
  monthlyIncome: number;
  permissions: ContactPermissions;
};

/** Müşteri bilgi güncelleme ekranında (MUSTGUNC) değiştirilebilen alanlar */
export type CustomerInfoUpdate = Pick<
  User,
  "email" | "phone" | "address" | "education" | "occupation" | "employer" | "monthlyIncome" | "permissions"
>;

type StoredUser = User & { password: string };

export const DEMO_PASSWORD = "demo123";

const seedUsers: StoredUser[] = [
  {
    id: "u-1",
    username: "eyup",
    password: DEMO_PASSWORD,
    name: "Eyüp Dalan",
    email: "eyup.dalan@dalan.dev",
    role: "Yönetici",
    title: "Platform Yöneticisi",
    department: "Bilgi Teknolojileri",
    phone: "+90 532 000 00 01",
    customerNo: "10000001",
    joinedAt: "2023-02-01",
    address: { city: "İstanbul", district: "Kadıköy", line: "Caferağa Mah. Moda Cad. No: 10" },
    education: "Yüksek Lisans",
    occupation: "Yazılım Mühendisi",
    employer: "Dalan Yazılım",
    monthlyIncome: 95000,
    permissions: { sms: true, email: true, phone: false },
  },
  {
    id: "u-2",
    username: "ayse",
    password: DEMO_PASSWORD,
    name: "Ayşe Kaya",
    email: "ayse.kaya@dalan.dev",
    role: "Analist",
    title: "Kıdemli İş Analisti",
    department: "Veri & Analitik",
    phone: "+90 532 000 00 02",
    customerNo: "10000002",
    joinedAt: "2024-05-13",
    address: { city: "Ankara", district: "Çankaya", line: "Kızılay Mah. Atatürk Bulv. No: 45" },
    education: "Lisans",
    occupation: "İş Analisti",
    employer: "Dalan Yazılım",
    monthlyIncome: 62000,
    permissions: { sms: true, email: false, phone: false },
  },
  {
    id: "u-3",
    username: "mehmet",
    password: DEMO_PASSWORD,
    name: "Mehmet Yılmaz",
    email: "mehmet.yilmaz@dalan.dev",
    role: "Müşteri Temsilcisi",
    title: "Müşteri Temsilcisi",
    department: "Müşteri Hizmetleri",
    phone: "+90 532 000 00 03",
    customerNo: "10000003",
    joinedAt: "2025-09-08",
    address: { city: "İzmir", district: "Karşıyaka", line: "Bostanlı Mah. Cemal Gürsel Cad. No: 7" },
    education: "Ön Lisans",
    occupation: "Müşteri Temsilcisi",
    employer: "Dalan Yazılım",
    monthlyIncome: 38000,
    permissions: { sms: false, email: true, phone: true },
  },
];

// Geliştirme sunucusunda modül yeniden yüklense de güncellemeler kaybolmasın.
const store = globalThis as unknown as { __fakeUsers?: StoredUser[] };
const users = (store.__fakeUsers ??= structuredClone(seedUsers));

function toPublic(stored: StoredUser): User {
  const { password, ...user } = stored;
  void password;
  return structuredClone(user);
}

export function findUserById(id: string | undefined): User | null {
  const user = users.find((u) => u.id === id);
  return user ? toPublic(user) : null;
}

export function verifyCredentials(username: string, password: string): User | null {
  const user = users.find(
    (u) => u.username === username.trim().toLowerCase() && u.password === password,
  );
  return user ? toPublic(user) : null;
}

export function updateUser(id: string, changes: CustomerInfoUpdate): User | null {
  const user = users.find((u) => u.id === id);
  if (!user) return null;
  Object.assign(user, structuredClone(changes));
  return toPublic(user);
}

/** Giriş ekranındaki "demo kullanıcı" kısayolları için */
export function listDemoUsers() {
  return users.map(({ username, name, role }) => ({ username, name, role }));
}
