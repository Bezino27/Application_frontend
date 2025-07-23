import React, { useContext, useState } from 'react';
import { Menu, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';

export default function ProfileMenu() {
    const { logout } = useContext(AuthContext);
    const router = useRouter();
    const [visible, setVisible] = useState(false);

    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);

    return (
        <Menu
            visible={visible}
            onDismiss={closeMenu}
            anchor={<IconButton icon="dots-vertical" size={24} onPress={openMenu} />}
        >
            <Menu.Item
                onPress={() => {
                    closeMenu();
                    router.push('/(stack)/profile-edit');
                }}
                title="Upraviť profil"
            />
            <Menu.Item
                onPress={() => {
                    closeMenu();
                    logout();
                }}
                title="Odhlásiť sa"
            />
        </Menu>
    );
}