import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

type Option = { label: string; value: any };

export default function CustomSelectModal({
                                              visible,
                                              options,
                                              onSelect,
                                              onClose,
                                              title,
                                          }: {
    visible: boolean;
    options: Option[];
    onSelect: (value: any) => void;
    onClose: () => void;
    title: string;
}) {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>{title}</Text>
                    <FlatList
                        data={options}
                        keyExtractor={(item) => item.value.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => onSelect(item.value)} style={styles.option}>
                                <Text style={styles.optionText}>{item.label}</Text>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>Zavrieť</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modal: {
        width: "85%",
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 12,
    },
    option: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
    optionText: {
        fontSize: 16,
        color: "#333",
    },
    closeButton: {
        marginTop: 16,
        alignItems: "center",
    },
    closeText: {
        color: "#D32F2F",
        fontSize: 16,
    },
});