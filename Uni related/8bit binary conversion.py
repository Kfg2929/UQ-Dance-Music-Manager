
UNSIGNED = "UNSIGNED"
SIGNED = "SIGNED"
ONESCOMPLEMENT = "ONESCOMPLEMENT"
TWOSCOMPLEMENT = "TWOSCOMPLEMENT"
EXCESS128 = "EXCESS128"

def decimalToUnsignedBinary(decimal: int):
    if (decimal < 0) or (decimal > 255):
        return "Negative Integers are not supported"
    return format(decimal, '010b')[2:]

def decimalToSignedBinary(decimal: int):
    if (decimal < -127) or (decimal > 127):
        return "Invalid input"
    sign = 0
    if decimal < 0:
        sign = 1
    return str(sign) + decimalToUnsignedBinary(abs(decimal))[1:]

# All bits flipped from abs(unsigned)
def decimalToOnesComplement(decimal: int):
    if (decimal < -127) or (decimal > 127):
        return "Invalid input"
    if (decimal < 0):
        # return decimalToUnsignedBinary(abs(decimal)).replace("1","2").replace("0","1").replace("2","0")
        return "1" + decimalToUnsignedBinary((127+decimal))[1:]
    else:
        return decimalToUnsignedBinary(decimal)

# Ones complement but plus 1
def decimalToTwosComplement(decimal: int):
    if (decimal < -128) or (decimal > 127):
        return "Invalid input"
    if (decimal > 0):
        return decimalToUnsignedBinary(decimal)
    ones = decimalToOnesComplement(decimal)
    ans = ""
    for i in range(len(ones)):
        if ones[::-1][i] == "1":
            ans += "0"
        else:
            ans += "1" + ones[::-1][i+1:]
            break
    return ans[::-1]

# Twos complement with an inverse MSB
def decimalToExcess128Binary(decimal: int):
    if (decimal < -128) or (decimal > 127):
        return "Invalid input"
    return decimalToUnsignedBinary(decimal+128)

def decimalToAll(decimal: int):
    print("--------------------")
    print(decimal)
    print("--------------------")
    print("Unsigned Binary:   " ,decimalToUnsignedBinary(decimal))
    print("")
    print("Signed Binary:     " ,decimalToSignedBinary(decimal))
    print("")
    print("Ones Binary:       " ,decimalToOnesComplement(decimal))
    print("")
    print("Twos Binary:       " ,decimalToTwosComplement(decimal))
    print("")
    print("Excess 128 Binary: " ,decimalToExcess128Binary(decimal))
    print("--------------------")


def unsignedBinaryToDecimal(binary: str):
    return int(str(binary), 2)

def signedBinaryToDecimal(binary: str):
    if binary[0] == "1":
        return -unsignedBinaryToDecimal(binary[1:])
    else:
        return unsignedBinaryToDecimal(binary[1:])

def onesComplementToDecimal(binary: str):
    if binary[0] == "1":
        return -127 + unsignedBinaryToDecimal("0" + binary[1:])
    else:
        return unsignedBinaryToDecimal(binary)

def twosComplementToDecimal(binary: str):
    if binary[0] == "1":
        return -128 + unsignedBinaryToDecimal("0" + binary[1:])
    else:
        return unsignedBinaryToDecimal(binary)

def excess128BinaryToDecimal(binary: str):
    return unsignedBinaryToDecimal(binary) - 128

def binaryToAll(binary: str):
    print("--------------------")
    print(binary)
    print("--------------------")
    print("Unsigned Binary:   " ,unsignedBinaryToDecimal(binary))
    print("")
    print("Signed Binary:     " ,signedBinaryToDecimal(binary))
    print("")
    print("Ones Binary:       " ,onesComplementToDecimal(binary))
    print("")
    print("Twos Binary:       " ,twosComplementToDecimal(binary))
    print("")
    print("Excess 128 Binary: " ,excess128BinaryToDecimal(binary))
    print("--------------------")


# Utility Functions

def binaryToDecimalTypeConversion(binary: str, type: str):
    if(type == UNSIGNED):
        decimal = unsignedBinaryToDecimal(binary)
    elif(type == SIGNED):
        decimal = signedBinaryToDecimal(binary)
    elif(type == ONESCOMPLEMENT):
        decimal = onesComplementToDecimal(binary)
    elif(type == TWOSCOMPLEMENT):
        decimal = twosComplementToDecimal(binary)
    elif(type == EXCESS128):
        decimal = excess128BinaryToDecimal(binary)
    else:
        print("Invalid binary type integer")
    return decimal

def decimalToBinaryTypeConversion(decimal: int, type: str):
    if(type == UNSIGNED):
        binary = decimalToUnsignedBinary(decimal)
    elif(type == SIGNED):
        binary = decimalToSignedBinary(decimal)
    elif(type == ONESCOMPLEMENT):
        binary = decimalToOnesComplement(decimal)
    elif(type == TWOSCOMPLEMENT):
        binary = decimalToTwosComplement(decimal)
    elif(type == EXCESS128):
        binary = decimalToExcess128Binary(decimal)
    else:
        print("Invalid decimal type integer")
    return binary
    

# Basic arithmetic

def binaryAdd(binary1: str, binary2: str, binary1Type: str, binary2Type: str):
    decimal1 = binaryToDecimalTypeConversion(binary1, binary1Type)
    decimal2 = binaryToDecimalTypeConversion(binary2, binary2Type)
    return decimal1 + decimal2

# First binary minus the second 
def binarySubtract(binary1: str, binary2: str, binary1Type: str, binary2Type: str):
    decimal1 = binaryToDecimalTypeConversion(binary1, binary1Type)
    decimal2 = binaryToDecimalTypeConversion(binary2, binary2Type)
    return decimal1 - decimal2

# First binary divided by the second 
def binaryDivide(binary1: str, binary2: str, binary1Type: str, binary2Type: str):
    decimal1 = binaryToDecimalTypeConversion(binary1, binary1Type)
    decimal2 = binaryToDecimalTypeConversion(binary2, binary2Type)
    return decimal1 / decimal2

def binaryMultiply(binary1: str, binary2: str, binary1Type: str, binary2Type: str):
    decimal1 = binaryToDecimalTypeConversion(binary1, binary1Type)
    decimal2 = binaryToDecimalTypeConversion(binary2, binary2Type)
    return decimal1 * decimal2


# decimalToAll(-32)
# binaryToAll("10000101")
# print(binaryAdd("10101010", "11011011", TWOSCOMPLEMENT, TWOSCOMPLEMENT))