
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';

type UserRole = 'admin' | 'operator' | null;

interface AdminContextType {
  user: User | null;
  userRole: UserRole;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType>({
  user: null,
  userRole: null,
  loading: true,
});

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // User is logged in, fetch their role from Firestore
        const userDocRef = doc(firestore, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserRole(userData.role || 'operator'); // Default to operator if role is not set
        } else {
            // This case might happen if the user doc hasn't been created yet
            setUserRole('operator'); 
        }
      } else {
        // User is not logged in
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AdminContext.Provider value={{ user, userRole, loading }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

    