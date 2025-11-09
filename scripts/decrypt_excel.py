import sys
import msoffcrypto
import io

def decrypt_file(input_path, output_path, password):
    """
    Decrypt a password-protected Excel file

    Args:
        input_path: Path to the encrypted Excel file
        output_path: Path to save the decrypted file
        password: Password to decrypt the file

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        with open(input_path, 'rb') as f:
            file = msoffcrypto.OfficeFile(f)
            file.load_key(password=password)

            with open(output_path, 'wb') as of:
                file.decrypt(of)

        print("SUCCESS", file=sys.stdout)
        return True
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        return False

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("ERROR: Invalid arguments. Usage: python decrypt_excel.py <input_file> <output_file> <password_file>", file=sys.stderr)
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]
    password_file = sys.argv[3]

    # 비밀번호 파일에서 읽기
    try:
        with open(password_file, 'r', encoding='utf-8') as f:
            password = f.read().strip()
    except Exception as e:
        print(f"ERROR: Failed to read password file: {str(e)}", file=sys.stderr)
        sys.exit(1)

    success = decrypt_file(input_file, output_file, password)
    sys.exit(0 if success else 1)
