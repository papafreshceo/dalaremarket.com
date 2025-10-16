// 권한 API 테스트 스크립트
async function testPermissionsAPI() {
  try {
    console.log('Testing permissions API...')

    const response = await fetch('http://localhost:3001/api/permissions?role=admin')
    console.log('Response status:', response.status)

    const data = await response.json()
    console.log('Response data:', JSON.stringify(data, null, 2))

  } catch (error) {
    console.error('Test failed:', error)
  }
}

testPermissionsAPI()
