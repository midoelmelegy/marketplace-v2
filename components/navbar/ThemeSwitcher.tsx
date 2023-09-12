import { useTheme } from 'next-themes'
import { Flex } from '../primitives'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { useMounted } from '../../hooks'
import { useMediaQuery } from 'react-responsive'

import { ToggleGroup, ToggleGroupItem } from '../primitives/ToggleGroup'

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme()
  const isMounted = useMounted()
  const isMobile = useMediaQuery({ maxWidth: 600 }) && isMounted

  if (isMobile) {
    return (
      <ToggleGroupRoot
        type="single"
        defaultValue={theme}
        css={{
          borderRadius: 0,
        }}
        aria-label="Change theme"
      >
        <ToggleGroupItem
          onClick={() => setTheme('light')}
          value="light"
          disabled={theme == 'light'}
          aria-label="Light Mode"
          css={{
            flex: 0.5,
            p: '$1',
          }}
        >
          <FontAwesomeIcon icon={faSun} width={16} height={16} />
        </ToggleGroupItem>
        <ToggleGroupItem
          onClick={() => setTheme('dark')}
          value="dark"
          disabled={theme == 'dark'}
          aria-label="Dark Mode"
          css={{
            flex: 0.5,
            p: '$1',
          }}
        >
          <FontAwesomeIcon icon={faMoon} width={16} height={16} />
        </ToggleGroupItem>
      </ToggleGroupRoot>
    )
  }

  return (
    <Flex>
      <ToggleGroup
        type="single"
        defaultValue="light"
        value={theme}
        css={{ width: '100%' }}
      >
        <ToggleGroupItem
          className="ToggleGroupItem"
          value="light"
          aria-label="Left aligned"
          css={{ flex: 1, width: 82 }}
          onClick={() => setTheme('light')}
        >
          <FontAwesomeIcon icon={faSun} width={16} height={16} />
        </ToggleGroupItem>

        <ToggleGroupItem
          className="ToggleGroupItem"
          value="dark"
          aria-label="Left aligned"
          css={{ flex: 1, width: 82 }}
          onClick={() => setTheme('dark')}
        >
          <FontAwesomeIcon icon={faMoon} width={16} height={16} />
        </ToggleGroupItem>
      </ToggleGroup>
    </Flex>
  )
}

export default ThemeSwitcher
