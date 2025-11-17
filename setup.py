from setuptools import find_packages, setup

setup(
    name="colonyos",
    version="0.1.0",
    packages=find_packages(include=["colonyos", "colonyos.*"]),
    install_requires=[
        "fastapi",
        "uvicorn[standard]",
        "click",
        "requests",
        "rich",
        "streamlit",
        "pandas",
        "plotly",
    ],
)
