# -*- mode: python ; coding: utf-8 -*-

"""
═══════════════════════════════════════════════════════════════════════════
    CHAMPION BOT - FINAL EDITION v3.0
    PyInstaller Spec File - Otimizado para Distribuição
═══════════════════════════════════════════════════════════════════════════
"""

block_cipher = None

a = Analysis(
    ['champion_interface_premium.py'],
    pathex=[],
    binaries=[],
    datas=[],  # Ícone opcional
    hiddenimports=[
        # Deriv API
        'deriv_api',
        'deriv_api.deriv_api',
        'deriv_api.utils',
        
        # WebSockets
        'websockets',
        'websockets.client',
        'websockets.server',
        'websockets.legacy',
        'websockets.legacy.client',
        'websockets.legacy.server',
        
        # Reactivex
        'reactivex',
        'reactivex.operators',
        'reactivex.scheduler',
        
        # Data Science
        'numpy',
        'numpy.core',
        'numpy.core._multiarray_umath',
        'pandas',
        'pandas._libs',
        'pandas._libs.tslibs',
        'pandas._libs.tslibs.timedeltas',
        
        # Typing
        'typing_extensions',
        
        # Asyncio
        'asyncio',
        'concurrent',
        'concurrent.futures',
        
        # JSON & Config
        'json',
        'configparser',
        'pathlib',
        
        # Threading
        'threading',
        '_thread',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Excluir bibliotecas desnecessárias para reduzir tamanho
        'matplotlib',
        'matplotlib.pyplot',
        'scipy',
        'PIL',
        'PyQt5',
        'PyQt6',
        'PySide2',
        'PySide6',
        'IPython',
        'notebook',
        'jupyter',
        'sphinx',
        'pytest',
        'setuptools',
        'distutils',
        'wheel',
        'pip',
        'test',
        'tests',
        'testing',
        'unittest',
        'tkinter.test',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(
    a.pure,
    a.zipped_data,
    cipher=block_cipher
)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ChampionBotPremium',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,  # Compressão UPX para reduzir tamanho
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Aplicação com janela (sem console)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,  # Ícone opcional
    version_file=None,
    uac_admin=False,  # Não requer privilégios admin
    uac_uiaccess=False,
)
