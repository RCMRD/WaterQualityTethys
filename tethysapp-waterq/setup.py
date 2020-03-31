from setuptools import setup, find_namespace_packages
from tethys_apps.app_installation import find_resource_files

# -- Apps Definition -- #
app_package = 'waterq'
release_package = 'tethysapp-' + app_package

# -- Python Dependencies -- #
dependencies = []

resource_files = find_resource_files('tethysapp/' + app_package + '/templates', 'tethysapp/' + app_package)
resource_files += find_resource_files('tethysapp/' + app_package + '/public', 'tethysapp/' + app_package)

setup(
    name=release_package,
    version='0.0.1',
    tags='Timeseries,Water Quality,Chlorophyll,Temperature',
    description='',
    long_description='',
    keywords='',
    author='James Wanjohi',
    author_email='jwanjohi@rcmrd.org',
    url='',
    license='',
    packages=find_namespace_packages(),
    package_data={'': resource_files},
    include_package_data=True,
    zip_safe=False,
    install_requires=dependencies,
)
