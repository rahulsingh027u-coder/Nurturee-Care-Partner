#!/usr/bin/env python3
"""
Comprehensive rename: caregiver → care partner across entire codebase.
Handles: snake_case (localStorage keys), kebab-case (import paths/file names),
         PascalCase (types/components), camelCase (variables/props), SCREAMING_SNAKE (constants).
"""
import os, re, shutil

SRC_DIR = '/home/z/my-project/src'

def replace_content(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # ORDER MATTERS — most specific patterns first to prevent partial double-replace

    # 1. snake_case localStorage key VALUES (string literals only)
    content = content.replace("nurturee_caregiver_verification_v2", "nurturee_care_partner_verification_v2")
    content = content.replace("nurturee_caregiver_verification", "nurturee_care_partner_verification")
    content = content.replace("nurturee_caregiver_registered_at", "nurturee_care_partner_registered_at")
    content = content.replace("nurturee_caregiver_registered", "nurturee_care_partner_registered")

    # 2. kebab-case file/folder paths in import strings
    content = content.replace("caregiver-data", "care-partner-data")
    content = content.replace("components/caregiver/", "components/care-partner/")
    content = content.replace("@/components/caregiver/", "@/components/care-partner/")
    content = content.replace("@/lib/caregiver-data", "@/lib/care-partner-data")

    # 3. PascalCase — types, interfaces, component names
    content = content.replace("Caregiver", "CarePartner")

    # 4. camelCase — variables, props, function names
    content = content.replace("caregiver", "carePartner")

    # 5. SCREAMING_SNAKE — constant names
    content = content.replace("CAREGIVER", "CARE_PARTNER")

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Step 1: Replace content in all .ts/.tsx files
changed_files = []
for root, dirs, files in os.walk(SRC_DIR):
    for filename in files:
        if filename.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, filename)
            if replace_content(filepath):
                changed_files.append(filepath)
                print(f"  ✏️  Updated: {filepath}")

print(f"\n📝 {len(changed_files)} files updated")

# Step 2: Rename files
renames = [
    (os.path.join(SRC_DIR, 'lib', 'caregiver-data.ts'),
     os.path.join(SRC_DIR, 'lib', 'care-partner-data.ts')),
    (os.path.join(SRC_DIR, 'components', 'caregiver', 'CaregiverLogin.tsx'),
     os.path.join(SRC_DIR, 'components', 'caregiver', 'CarePartnerLogin.tsx')),
    (os.path.join(SRC_DIR, 'components', 'caregiver', 'CaregiverLayout.tsx'),
     os.path.join(SRC_DIR, 'components', 'caregiver', 'CarePartnerLayout.tsx')),
]

print("\n📁 Renaming files...")
for old, new in renames:
    if os.path.exists(old):
        os.rename(old, new)
        print(f"  ✅ {os.path.basename(old)} → {os.path.basename(new)}")
    else:
        print(f"  ⚠️  Not found: {old}")

# Step 3: Rename folder
old_folder = os.path.join(SRC_DIR, 'components', 'caregiver')
new_folder = os.path.join(SRC_DIR, 'components', 'care-partner')
if os.path.exists(old_folder):
    os.rename(old_folder, new_folder)
    print(f"\n📂 Folder renamed: caregiver/ → care-partner/")
else:
    print(f"\n⚠️  Folder not found: {old_folder}")

print("\n✅ Rename complete!")
