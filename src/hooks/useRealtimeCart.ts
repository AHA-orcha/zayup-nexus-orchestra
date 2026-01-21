import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Json } from '@/integrations/supabase/types';

export interface RealtimeCartItem {
  id: string;
  session_id: string;
  item_name: string;
  size: string | null;
  modifications: string[];
  quantity: number;
  price: number;
  created_at: string;
}

// Helper to safely parse modifications from JSONB
const parseModifications = (mods: Json | null): string[] => {
  if (!mods) return [];
  if (Array.isArray(mods)) {
    return mods.filter((m): m is string => typeof m === 'string');
  }
  return [];
};

export const useRealtimeCart = (sessionId: string | null) => {
  const [items, setItems] = useState<RealtimeCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    // Initial fetch
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        setItems(data.map(item => ({
          ...item,
          size: item.size ?? null,
          modifications: parseModifications(item.modifications)
        })));
      }
      setIsLoading(false);
    };
    fetchItems();

    // Subscribe to realtime changes
    channelRef.current = supabase
      .channel(`cart-${sessionId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cart_items', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const newItem = payload.new as Record<string, unknown>;
          setItems(prev => [...prev, {
            id: newItem.id as string,
            session_id: newItem.session_id as string,
            item_name: newItem.item_name as string,
            size: (newItem.size as string) ?? null,
            modifications: parseModifications(newItem.modifications as Json),
            quantity: newItem.quantity as number,
            price: newItem.price as number,
            created_at: newItem.created_at as string
          }]);
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'cart_items', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const oldItem = payload.old as Record<string, unknown>;
          setItems(prev => prev.filter(i => i.id !== (oldItem.id as string)));
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cart_items', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const updatedItem = payload.new as Record<string, unknown>;
          setItems(prev => prev.map(i => 
            i.id === (updatedItem.id as string)
              ? {
                  id: updatedItem.id as string,
                  session_id: updatedItem.session_id as string,
                  item_name: updatedItem.item_name as string,
                  size: (updatedItem.size as string) ?? null,
                  modifications: parseModifications(updatedItem.modifications as Json),
                  quantity: updatedItem.quantity as number,
                  price: updatedItem.price as number,
                  created_at: updatedItem.created_at as string
                }
              : i
          ));
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId]);

  const total = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  // Clear cart for session
  const clearCart = async () => {
    if (!sessionId) return;
    await supabase.from('cart_items').delete().eq('session_id', sessionId);
    setItems([]);
  };

  return { items, total, isLoading, clearCart };
};
