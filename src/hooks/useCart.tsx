import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => void;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const findProductOnCart = updatedCart.find(product => product.id === productId);

      const { data: stock } = await api.get(`stock/${productId}`);

      const currentAmount = findProductOnCart ? findProductOnCart.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stock.amount) {
        return toast.error('Quantidade solicitada fora de estoque');
      }

      if (findProductOnCart) {
        findProductOnCart.amount = amount;
      } else {
        const { data: product } = await api.get(`products/${productId}`);

        const newProduct = {
          ...product,
          amount: 1,
        }
        updatedCart.push(newProduct);
      }
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productIndex = updatedCart.findIndex(product => product.id === productId);

      if (productIndex >= 0) {
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        toast.error('Erro na remoção do produto');
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stock } = await api.get(`stock/${productId}`);

      if (amount > stock.amount) {
        return toast.error('Quantidade solicitada fora de estoque');
      }

      if (amount < 1) {
        return toast.error('Erro na alteração de quantidade do produto');
      }

      const updateAmount = cart.map(product => {
        if (product.id === productId) {
          const updateProdcut = {
            ...product,
            amount
          }
          return updateProdcut;
        }
        return product;
      })

      setCart(updateAmount);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateAmount));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
