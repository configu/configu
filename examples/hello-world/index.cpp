#include <iostream>
#include <cstdlib>

int main()
{
  std::cout << "=== cpp ===" << std::endl;
  const char* var1 = std::getenv("MESSAGE");
  std::cout << var1 << std::endl;
  return 0;
}
