#pragma once

#include <ArduinoJson.h>
#include <cstdint>
#include <cstring>

namespace IotCommander
{
  class StaticBufferAllocator : public ArduinoJson::Allocator {
  public:
    StaticBufferAllocator(uint8_t* buffer, size_t size)
      : buffer_(buffer), capacity_(size), offset_(0) {
    }

    void* allocate(size_t size) override {
      size = align(size);
      const size_t totalSize = size + sizeof(BlockHeader);

      // First attempt
      if (offset_ + totalSize > capacity_) {
        // Not enough space → reset and retry once
        reset();

        if (offset_ + totalSize > capacity_) {
          // Still doesn't fit → real failure
          return nullptr;
        }
      }

      auto* header = reinterpret_cast<BlockHeader*>(buffer_ + offset_);
      header->size = size;

      void* userPtr = header + 1;
      offset_ += totalSize;

      return userPtr;
    }

    void deallocate(void*) override {
      // Arena allocator: no-op
    }

    void* reallocate(void* ptr, size_t new_size) override {
      if (!ptr) {
        return allocate(new_size);
      }

      auto* header = reinterpret_cast<BlockHeader*>(ptr) - 1;
      const size_t old_size = header->size;

      new_size = align(new_size);

      void* new_ptr = allocate(new_size);
      if (!new_ptr)
        return nullptr;

      std::memcpy(new_ptr, ptr, old_size < new_size ? old_size : new_size);
      return new_ptr;
    }

    void reset() {
      offset_ = 0;
    }

  private:
    struct BlockHeader {
      size_t size;
    };

    static size_t align(size_t n) {
      constexpr size_t alignment = 4; // ESP32 internal RAM optimized
      return (n + alignment - 1) & ~(alignment - 1);
    }

    uint8_t* buffer_;
    size_t capacity_;
    size_t offset_;
  };
}