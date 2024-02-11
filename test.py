import serial
import time
import struct
# Liste des IDs avec leur description et unité (si disponible)
id_list = [
("002400010050", "Air Filter Restriction", "kPa"),
("002400010029", "Atmospheric Pressure", "kPa"),
("002400010008", "Boost Pressure", "kPa"),
("005100010ABD", "Brake Accumulator Pressure", "kPa"),
("00510001041D", "Brake Accumulator Pressure Status", ""),
("00510001053A", "Brake Oil Pressure Status", ""),
("00510001039A", "Brake Oil Pressure Warning Indicator", ""),
("001B000115A6", "DPF #1 Intake Pressure", "kPa"),
("001B00010E71", "DPF #1 Intake Temperature", "°C"),
("002400010015", "Engine Coolant Temperature", "°C"),
("002400010009", "Engine Oil Pressure", "kPa"),
("002400010236", "Engine Power Derate", "%"),
("002400010000", "Engine Speed", "rpm"),
("002700011A18", "Front Axle Oil Pressure Switch Status", ""),
("002700010105", "Front Axle Oil Temperature", "°C"),
("00270001053C", "Front Axle Oil Temperature Status", ""),
("0051000100F7", "Front Brake Pressure", "kPa"),
("0024000100B2", "Fuel Consumption Rate", "L/h"),
("002700010184", "Fuel Gauge", "%"),
("002400010007", "Fuel Pressure", "kPa"),
("00510001005D", "Gear", ""),
("0051000A004F", "Ground Speed", "mph"),
("002700011648", "Hydraulic Oil Add Level Switch Status", ""),
("00270001005E", "Hydraulic Oil Temperature", "°C"),
("0027000100A9", "Hydraulic Oil Temperature Status", ""),
("002400011176", "Intake Manifold Air Temperature", "°C"),
("004A00070004", "Load Count", ""),
("005100010275", "Lockup Clutch Current Percentage", "%"),
("00510001026D", "Lockup Clutch Enable Switch", ""),
("005100010089", "Neutralize Switch", ""),
("0051000100E4", "Parking Brake", ""),
("0024000100B4", "Percent Engine Load at Current Engine Speed",
"%"),
("00510001038C", "Powertrain Filter Bypass Status", ""),
("002700011A19", "Rear Axle Oil Pressure Switch Status", ""),
("002700010107", "Rear Axle Oil Temperature", "°C"),
("00270001053D", "Rear Axle Oil Temperature Status", ""),
("0051000100FA", "Rear Brake Pressure", "kPa"),
("002400010002", "Throttle Position", "%"),
("00A181010000", "Timestamp Current", ""),
("005100010101", "Torque Converter Outlet Temperature", "°C"),
("002400050003", "Total Distance", "km"),
("002400050004", "Total Fuel", "gal"),
16
("004A000B002F", "Total Pass Count", ""),
("0051000100B6", "Transmission Oil Pressure", "kPa"),
# ... (ajoutez le reste de vos IDs)
]
ID = '0163' # ID 163 requete
SEQ = '0005' # Sequence number
def crc16(ch, crc):
    bits = 8
    c = crc
    for _ in range(bits):
    if ((ch & 0x01) ^ (c & 0x01)):
        c >>= 1
        c ^= 0x8408
    else:
        c >>= 1
        ch >>= 1
    return c
def slipcrc(buf):
    crc = 0
    for byte in buf:
        crc = crc16(byte, crc)
    crc = (crc ^ 0xFFFF) # Complément du CRC
    crcbuf = bytearray([(crc >> 8) & 0xFF, crc & 0xFF]) # Ordre de octets corrigé
    return crcbuf
def generate_data_groups():
    group_size = 4
    data_groups = [id_list[i:i + group_size] for i in range(0,
    len(id_list), group_size)]
    return data_groups
def parse_dynamic_trame(trame_hex, sent_ids):
# Convertir en binaire
    trame_binary = bin(int(trame_hex, 16))[2:].zfill(len(trame_hex) *
4)
# Parsing de la trame
rpc_number = trame_hex[:4]
sequence_number = trame_hex[4:8]
crc_ack = trame_hex[8:12]
end_char1 = trame_hex[12:14]
rpc_number2 = trame_hex[14:18]
sequence_number2 = trame_hex[18:22]
num_bytes = int(trame_hex[22:26], 16)
param_count = int(trame_hex[26:30], 16)
# Extraire les valeurs hexadécimales des paramètres VIMS
vims_param_hex = [trame_hex[i:i + 8] for i in range(30, 30 +
param_count * 8, 8)]
# Conversion des valeurs hexadécimales en float
vims_param_float = [struct.unpack('!f', bytes.fromhex(param))[0]
for param in vims_param_hex]
17
# CRC et End Char
crc = trame_hex[-6:-2]
end_char2 = trame_hex[-2:]
# Affichage des résultats
print("RPC Number:", rpc_number)
print("Sequence Number:", sequence_number)
print("CRC ACK:", crc_ack)
print("End Char 1:", end_char1)
print("RPC Number 2:", rpc_number2)
print("Sequence Number 2:", sequence_number2)
print("Number of Bytes:", num_bytes)
print("Parameter Count:", param_count)
# Affichage des paramètres VIMS de manière dynamique
for i, (param, sent_id) in enumerate(zip(vims_param_hex, sent_ids)):
id_description = next((desc for id_, desc, _ in id_list if id_
== sent_id), f"Unknown ID {sent_id}")
print(f"VIMS Parameter Value #{i + 1} ({id_description}):",
param, "(Float:", vims_param_float[i], ")")
print("CRC:", crc)
print("End Char 2:", end_char2)
# Fonction d'envoi et de réception
def send_and_receive(data, port, baud_rate, mode='MSB',
invert_bits=False, sent_ids=None):
try:
    # Ouvrir la connexion série
    ser = serial.Serial(port, baud_rate, timeout=1)
    # Convertir la trame hexadécimale en bytes
    if mode == 'MSB':
        byte_data = bytes.fromhex(data)
    elif mode == 'LSB':
        byte_data = bytes.fromhex(data)[::-1]
    else:
        raise ValueError("Mode non supporté. Utilisez 'MSB' ou'LSB'.")
    # Ajouter ID et SEQ à la trame
    id_seq_data = bytes.fromhex(ID + SEQ)
    full_data = id_seq_data + byte_data
    # Inverser la trame bit par bit si nécessaire
    if invert_bits:
    inverted_data = bytes([(byte ^ 0xFF) for byte in
    full_data])
    full_data = inverted_data[::-1]
    # Calculer le CRC et l'ajouter à la trame
    crc = slipcrc(full_data)
    crc1 = bytes([crc[1], crc[0]])
    full_data_with_crc = full_data + crc1
    # Ajouter le dernier octet de valeur C0
    18
    full_data_with_crc_and_C0 = full_data_with_crc +
    bytearray([0xC0])
    # Envoyer la trame avec le CRC et le dernier octet
    ser.write(full_data_with_crc_and_C0)
    # Lire la réponse
    response = ser.read(ser.in_waiting or 100)
    # Afficher la trame envoyée et la réponse
    print(f"Mode: {mode}, Invert Bits: {invert_bits}")
    print(f"Trame envoyée: {full_data_with_crc_and_C0.hex()}")
    print(f"Réponse reçue: {response.hex()}")
    # Parsez la réponse avec la fonction de parsage
    if response:
    trame_hex = response.hex()
    parse_dynamic_trame(trame_hex, sent_ids=sent_ids)
    # Fermer la connexion série
    ser.close()
    return response
except Exception as e:
print(f"Une erreur s'est produite: {str(e)}")
# Exemple d'utilisation
port_name = 'COM3' # Remplacez par le port série correct sur votre
système
baud_rate = 9600
# Générer les groupes de données
data_groups = generate_data_groups()
# Envoyer les groupes avec intervalles
for group in data_groups:
hex_data = f"{len(group):04d}{''.join([id[0] for id in group])}"
sent_ids = [id[0] for id in group]
response = send_and_receive(hex_data, port_name, baud_rate,
sent_ids=sent_ids)
time.sleep(1)