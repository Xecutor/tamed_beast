cmake_minimum_required(VERSION 3.0)

project("tamed_beast")

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

cmake_policy(SET CMP0003 NEW)

if(NOT VCPKG_ROOT AND DEFINED ENV{VCPKG_ROOT})
  set(VCPKG_ROOT $ENV{VCPKG_ROOT})
endif()

if(VCPKG_ROOT)
  include(${VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake)
endif()

set(Boost_USE_STATIC_RUNTIME OFF)
set(Boost_USE_STATIC_LIBS ON)
set(Boost_USE_MULTITHREADED ON)

find_package(Boost 1.67 REQUIRED COMPONENTS system date_time filesystem locale)
find_package(OpenSSL REQUIRED)
find_package(RapidJSON REQUIRED)
find_package(fmt REQUIRED)

add_executable(tamed_beast 
    tamed_beast.cpp
    web_server.cpp
    json_rpc_service.cpp)

target_include_directories(tamed_beast PRIVATE ${RAPIDJSON_INCLUDE_DIRS})
target_compile_definitions(tamed_beast PRIVATE RAPIDJSON_HAS_STDSTRING=1)

target_link_libraries(
    tamed_beast
    Boost::system
    Boost::date_time
    Boost::filesystem
    Boost::locale

    fmt::fmt

    OpenSSL::SSL
    OpenSSL::Crypto)

if(WIN32)
  target_compile_definitions(tamed_beast PRIVATE _WIN32_WINNT=0x0601 _CRT_SECURE_NO_WARNINGS=1 _SCL_SECURE_NO_WARNINGS=1)
endif()
