export const STORAGE_KEYS = {
    USER: "smartward_logged_user",
    REGISTERED_USER: "smartwardUser",
    PATIENTS: "smartward_patients",
    WARDS: "smartward_wards",
    VITALS: "smartward_vitals",
    MEDICATIONS: "smartward_medications",
};

export function getItem(key, fallback = null) {
    if (typeof window === "undefined") return fallback;

    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        console.error("getItem error:", error);
        return fallback;
    }
}

export function setItem(key, value) {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error("setItem error:", error);
    }
}

export function removeItem(key) {
    if (typeof window === "undefined") return;

    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error("removeItem error:", error);
    }
}

/* Aliases for old code compatibility */
export function readStorage(key, fallback = null) {
    return getItem(key, fallback);
}

export function writeStorage(key, value) {
    return setItem(key, value);
}

export function deleteStorage(key) {
    return removeItem(key);
}

export function clearSmartWardStorage() {
    if (typeof window === "undefined") return;

    try {
        Object.values(STORAGE_KEYS).forEach((key) => {
            localStorage.removeItem(key);
        });
    } catch (error) {
        console.error("clearSmartWardStorage error:", error);
    }
}