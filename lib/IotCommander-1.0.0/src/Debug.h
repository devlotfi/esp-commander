#pragma once

#include <iostream>

#ifdef IOTC_DEBUG
#define IOTC_LOG(x) do { std::cout << x << std::endl; } while (0)
#else
#define IOTC_LOG(x)
#endif