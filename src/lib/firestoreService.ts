import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Citerne,
  Vehicle,
  StockEntry,
  FuelDispense,
  User,
  Fournisseur,
  VehicleTypeConfig,
  Subscription,
  AuditLog
} from '../types';

export interface CloudSyncStatus {
  lastSyncTime: string | null;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
  itemsCount: {
    citernes: number;
    vehicles: number;
    entries: number;
    dispenses: number;
    users: number;
    subscriptions: number;
  };
}

export const firestoreService = {
  // --- CITERNES ---
  async syncCiternes(citernes: Citerne[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const item of citernes) {
        const ref = doc(db, 'citernes', item.id);
        batch.set(ref, item);
      }
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'citernes');
    }
  },

  async fetchCiternes(): Promise<Citerne[]> {
    try {
      const snap = await getDocs(collection(db, 'citernes'));
      return snap.docs.map(d => d.data() as Citerne);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'citernes');
      return [];
    }
  },

  // --- VEHICLES ---
  async syncVehicles(vehicles: Vehicle[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const item of vehicles) {
        const ref = doc(db, 'vehicles', item.id);
        batch.set(ref, item);
      }
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'vehicles');
    }
  },

  async fetchVehicles(): Promise<Vehicle[]> {
    try {
      const snap = await getDocs(collection(db, 'vehicles'));
      return snap.docs.map(d => d.data() as Vehicle);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'vehicles');
      return [];
    }
  },

  // --- STOCK ENTRIES ---
  async syncStockEntries(entries: StockEntry[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const item of entries) {
        const ref = doc(db, 'stock_entries', item.id);
        batch.set(ref, item);
      }
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'stock_entries');
    }
  },

  async fetchStockEntries(): Promise<StockEntry[]> {
    try {
      const snap = await getDocs(collection(db, 'stock_entries'));
      return snap.docs.map(d => d.data() as StockEntry);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'stock_entries');
      return [];
    }
  },

  // --- FUEL DISPENSES ---
  async syncFuelDispenses(dispenses: FuelDispense[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const item of dispenses) {
        const ref = doc(db, 'fuel_dispenses', item.id);
        batch.set(ref, item);
      }
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'fuel_dispenses');
    }
  },

  async fetchFuelDispenses(): Promise<FuelDispense[]> {
    try {
      const snap = await getDocs(collection(db, 'fuel_dispenses'));
      return snap.docs.map(d => d.data() as FuelDispense);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'fuel_dispenses');
      return [];
    }
  },

  // --- USERS ---
  async syncUsers(users: User[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const item of users) {
        const ref = doc(db, 'users', item.id);
        batch.set(ref, item);
      }
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'users');
    }
  },

  async fetchUsers(): Promise<User[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => d.data() as User);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'users');
      return [];
    }
  },

  // --- SUBSCRIPTIONS ---
  async syncSubscriptions(subs: Subscription[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const item of subs) {
        const ref = doc(db, 'subscriptions', item.id);
        batch.set(ref, item);
      }
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'subscriptions');
    }
  },

  async fetchSubscriptions(): Promise<Subscription[]> {
    try {
      const snap = await getDocs(collection(db, 'subscriptions'));
      return snap.docs.map(d => d.data() as Subscription);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'subscriptions');
      return [];
    }
  },

  // --- FULL CLOUD BACKEND PUSH & PULL ---
  async pushAllToCloud(data: {
    citernes: Citerne[];
    vehicles: Vehicle[];
    entries: StockEntry[];
    dispenses: FuelDispense[];
    fournisseurs: Fournisseur[];
    vehicleTypes: VehicleTypeConfig[];
    users: User[];
    subscriptions: Subscription[];
  }): Promise<{ success: boolean; error?: string }> {
    try {
      await Promise.all([
        this.syncCiternes(data.citernes),
        this.syncVehicles(data.vehicles),
        this.syncStockEntries(data.entries),
        this.syncFuelDispenses(data.dispenses),
        this.syncUsers(data.users),
        this.syncSubscriptions(data.subscriptions)
      ]);
      return { success: true };
    } catch (err: any) {
      console.error('Erreur synchronisation Cloud Backend:', err);
      return { success: false, error: err?.message || 'Erreur inconnue de synchronisation Cloud' };
    }
  },

  async pullAllFromCloud(): Promise<{
    citernes: Citerne[];
    vehicles: Vehicle[];
    entries: StockEntry[];
    dispenses: FuelDispense[];
    users: User[];
    subscriptions: Subscription[];
  }> {
    const [citernes, vehicles, entries, dispenses, users, subscriptions] = await Promise.all([
      this.fetchCiternes(),
      this.fetchVehicles(),
      this.fetchStockEntries(),
      this.fetchFuelDispenses(),
      this.fetchUsers(),
      this.fetchSubscriptions()
    ]);

    return {
      citernes,
      vehicles,
      entries,
      dispenses,
      users,
      subscriptions
    };
  }
};
